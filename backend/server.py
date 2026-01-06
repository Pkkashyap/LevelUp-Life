from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from collections import defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    icon: str
    color: str
    is_custom: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CategoryCreate(BaseModel):
    name: str
    icon: str
    color: str
    is_custom: bool = True

class Activity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    category_id: str
    category_name: str
    date: str
    start_time: str  # Format: "HH:MM" (24-hour)
    duration: int
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ActivityCreate(BaseModel):
    category_id: str
    category_name: str
    date: str
    start_time: str  # Format: "HH:MM"
    duration: int
    notes: Optional[str] = None

class Goal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    category_id: str
    category_name: str
    target: int
    period: str
    current_progress: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class GoalCreate(BaseModel):
    category_id: str
    category_name: str
    target: int
    period: str

class Badge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    icon: str
    earned_date: Optional[str] = None
    is_earned: bool = False

class UserStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "user_stats"
    level: int = 1
    xp: int = 0
    total_activities: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    last_activity_date: Optional[str] = None

class UserStatsUpdate(BaseModel):
    xp: Optional[int] = None
    level: Optional[int] = None

# Initialize default categories
async def init_default_categories():
    count = await db.categories.count_documents({})
    if count == 0:
        default_categories = [
            {"id": "study", "name": "Study", "icon": "BookOpen", "color": "#3B82F6", "is_custom": False, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": "gaming", "name": "Gaming", "icon": "Gamepad2", "color": "#8B5CF6", "is_custom": False, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": "gym", "name": "Gym", "icon": "Dumbbell", "color": "#EF4444", "is_custom": False, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": "sleep", "name": "Sleep", "icon": "Moon", "color": "#6366F1", "is_custom": False, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.categories.insert_many(default_categories)

# Initialize user stats
async def init_user_stats():
    stats = await db.user_stats.find_one({"id": "user_stats"}, {"_id": 0})
    if not stats:
        default_stats = {
            "id": "user_stats",
            "level": 1,
            "xp": 0,
            "total_activities": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "last_activity_date": None
        }
        await db.user_stats.insert_one(default_stats)

# Initialize badges
async def init_badges():
    count = await db.badges.count_documents({})
    if count == 0:
        default_badges = [
            {"id": "first_step", "name": "First Step", "description": "Log your first activity", "icon": "Footprints", "is_earned": False},
            {"id": "week_warrior", "name": "Week Warrior", "description": "Maintain a 7-day streak", "icon": "Flame", "is_earned": False},
            {"id": "centurion", "name": "Centurion", "description": "Log 100 activities", "icon": "Trophy", "is_earned": False},
            {"id": "level_5", "name": "Rising Star", "description": "Reach Level 5", "icon": "Star", "is_earned": False},
            {"id": "level_10", "name": "Expert", "description": "Reach Level 10", "icon": "Award", "is_earned": False},
            {"id": "month_master", "name": "Month Master", "description": "Maintain a 30-day streak", "icon": "Crown", "is_earned": False},
        ]
        await db.badges.insert_many(default_badges)

@app.on_event("startup")
async def startup_event():
    await init_default_categories()
    await init_user_stats()
    await init_badges()

# Categories endpoints
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate):
    import uuid
    category_dict = category.model_dump()
    category_dict["id"] = str(uuid.uuid4())
    category_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.categories.insert_one(category_dict)
    return Category(**category_dict)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

# Activities endpoints
@api_router.get("/activities", response_model=List[Activity])
async def get_activities(category_id: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    activities = await db.activities.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return activities

@api_router.post("/activities", response_model=Activity)
async def create_activity(activity: ActivityCreate):
    import uuid
    activity_dict = activity.model_dump()
    activity_dict["id"] = str(uuid.uuid4())
    activity_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.activities.insert_one(activity_dict)
    
    # Update user stats
    await update_user_stats_on_activity(activity_dict["date"], activity_dict["duration"])
    
    # Check and update badges
    await check_badges()
    
    return Activity(**activity_dict)

@api_router.delete("/activities/{activity_id}")
async def delete_activity(activity_id: str):
    result = await db.activities.delete_one({"id": activity_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"message": "Activity deleted"}

# Goals endpoints
@api_router.get("/goals", response_model=List[Goal])
async def get_goals():
    goals = await db.goals.find({}, {"_id": 0}).to_list(100)
    return goals

@api_router.post("/goals", response_model=Goal)
async def create_goal(goal: GoalCreate):
    import uuid
    goal_dict = goal.model_dump()
    goal_dict["id"] = str(uuid.uuid4())
    goal_dict["current_progress"] = 0
    goal_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.goals.insert_one(goal_dict)
    return Goal(**goal_dict)

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str):
    result = await db.goals.delete_one({"id": goal_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted"}

# User stats endpoints
@api_router.get("/stats", response_model=UserStats)
async def get_user_stats():
    stats = await db.user_stats.find_one({"id": "user_stats"}, {"_id": 0})
    if not stats:
        await init_user_stats()
        stats = await db.user_stats.find_one({"id": "user_stats"}, {"_id": 0})
    return UserStats(**stats)

# Badges endpoints
@api_router.get("/badges", response_model=List[Badge])
async def get_badges():
    badges = await db.badges.find({}, {"_id": 0}).to_list(100)
    return badges

class BadgeCreate(BaseModel):
    name: str
    description: str
    icon: str
    condition_type: str  # streak, activity_count, level, category_specific
    condition_value: int

@api_router.post("/badges", response_model=Badge)
async def create_badge(badge: BadgeCreate):
    import uuid
    badge_dict = badge.model_dump()
    badge_dict["id"] = str(uuid.uuid4())
    badge_dict["is_earned"] = False
    badge_dict["earned_date"] = None
    await db.badges.insert_one(badge_dict)
    return Badge(**badge_dict)

@api_router.delete("/badges/{badge_id}")
async def delete_badge(badge_id: str):
    result = await db.badges.delete_one({"id": badge_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Badge not found")
    return {"message": "Badge deleted"}

# Analytics endpoints
@api_router.get("/analytics/summary")
async def get_analytics_summary():
    # Get activities for the last 30 days
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=30)
    
    activities = await db.activities.find({
        "date": {"$gte": start_date.date().isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    # Calculate summary by category
    category_totals = defaultdict(int)
    for activity in activities:
        category_totals[activity["category_name"]] += activity["duration"]
    
    return {"category_totals": dict(category_totals), "total_activities": len(activities)}

@api_router.get("/analytics/daily")
async def get_daily_analytics(days: int = 7):
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    activities = await db.activities.find({
        "date": {"$gte": start_date.date().isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    # Group by date
    daily_data = defaultdict(lambda: defaultdict(int))
    for activity in activities:
        date = activity["date"]
        category = activity["category_name"]
        daily_data[date][category] += activity["duration"]
    
    # Format for recharts
    result = []
    for i in range(days):
        date = (start_date + timedelta(days=i)).date().isoformat()
        data_point = {"date": date}
        if date in daily_data:
            data_point.update(daily_data[date])
        result.append(data_point)
    
    return result

@api_router.get("/analytics/category/{category_id}")
async def get_category_analytics(category_id: str, days: int = 30):
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    activities = await db.activities.find({
        "category_id": category_id,
        "date": {"$gte": start_date.date().isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    # Group by date
    daily_totals = defaultdict(int)
    for activity in activities:
        daily_totals[activity["date"]] += activity["duration"]
    
    # Format for recharts
    result = []
    for i in range(days):
        date = (start_date + timedelta(days=i)).date().isoformat()
        result.append({
            "date": date,
            "duration": daily_totals.get(date, 0)
        })
    
    return result

# Helper functions
async def update_user_stats_on_activity(activity_date: str, duration: int):
    stats = await db.user_stats.find_one({"id": "user_stats"}, {"_id": 0})
    if not stats:
        return
    
    # Add XP (10 XP per minute)
    xp_gained = duration * 10
    new_xp = stats["xp"] + xp_gained
    new_level = stats["level"]
    
    # Level up logic (100 XP per level)
    xp_per_level = 100
    while new_xp >= xp_per_level * new_level:
        new_xp -= xp_per_level * new_level
        new_level += 1
    
    # Update streak
    current_streak = stats["current_streak"]
    longest_streak = stats["longest_streak"]
    last_activity_date = stats.get("last_activity_date")
    
    if last_activity_date:
        last_date = datetime.fromisoformat(last_activity_date).date()
        current_date = datetime.fromisoformat(activity_date).date()
        days_diff = (current_date - last_date).days
        
        if days_diff == 1:
            current_streak += 1
        elif days_diff > 1:
            current_streak = 1
    else:
        current_streak = 1
    
    longest_streak = max(longest_streak, current_streak)
    
    await db.user_stats.update_one(
        {"id": "user_stats"},
        {"$set": {
            "xp": new_xp,
            "level": new_level,
            "total_activities": stats["total_activities"] + 1,
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "last_activity_date": activity_date
        }}
    )

async def check_badges():
    stats = await db.user_stats.find_one({"id": "user_stats"}, {"_id": 0})
    if not stats:
        return
    
    # Check First Step badge
    if stats["total_activities"] >= 1:
        await db.badges.update_one(
            {"id": "first_step"},
            {"$set": {"is_earned": True, "earned_date": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Check Week Warrior badge
    if stats["current_streak"] >= 7:
        await db.badges.update_one(
            {"id": "week_warrior"},
            {"$set": {"is_earned": True, "earned_date": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Check Centurion badge
    if stats["total_activities"] >= 100:
        await db.badges.update_one(
            {"id": "centurion"},
            {"$set": {"is_earned": True, "earned_date": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Check level badges
    if stats["level"] >= 5:
        await db.badges.update_one(
            {"id": "level_5"},
            {"$set": {"is_earned": True, "earned_date": datetime.now(timezone.utc).isoformat()}}
        )
    
    if stats["level"] >= 10:
        await db.badges.update_one(
            {"id": "level_10"},
            {"$set": {"is_earned": True, "earned_date": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Check Month Master badge
    if stats["current_streak"] >= 30:
        await db.badges.update_one(
            {"id": "month_master"},
            {"$set": {"is_earned": True, "earned_date": datetime.now(timezone.utc).isoformat()}}
        )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()