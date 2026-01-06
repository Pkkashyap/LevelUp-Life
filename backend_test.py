import requests
import sys
import json
from datetime import datetime, timedelta

class ProgressTrackingAPITester:
    def __init__(self, base_url="https://progress-pulse-122.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, description=""):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if description:
            print(f"   Description: {description}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json() if response.content else {}
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "description": description
            })

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": str(e),
                "description": description
            })
            return False, {}

    def test_categories(self):
        """Test categories endpoints"""
        print("\n" + "="*50)
        print("TESTING CATEGORIES")
        print("="*50)
        
        # Get categories
        success, categories = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200,
            description="Should return default categories (Study, Gaming, Gym, Sleep)"
        )
        
        if success and categories:
            print(f"   Found {len(categories)} categories")
            default_categories = ['Study', 'Gaming', 'Gym', 'Sleep']
            found_defaults = [cat['name'] for cat in categories if cat['name'] in default_categories]
            print(f"   Default categories found: {found_defaults}")
        
        # Create custom category
        custom_category_data = {
            "name": "Test Reading",
            "icon": "Book",
            "color": "#10B981",
            "is_custom": True
        }
        
        success, new_category = self.run_test(
            "Create Custom Category",
            "POST",
            "categories",
            200,
            custom_category_data,
            "Should create a new custom category"
        )
        
        created_category_id = None
        if success and new_category:
            created_category_id = new_category.get('id')
            print(f"   Created category ID: {created_category_id}")
        
        # Delete custom category (cleanup)
        if created_category_id:
            self.run_test(
                "Delete Custom Category",
                "DELETE",
                f"categories/{created_category_id}",
                200,
                description="Should delete the custom category"
            )
        
        return categories

    def test_user_stats(self):
        """Test user stats endpoints"""
        print("\n" + "="*50)
        print("TESTING USER STATS")
        print("="*50)
        
        success, stats = self.run_test(
            "Get User Stats",
            "GET",
            "stats",
            200,
            description="Should return user stats with level, XP, streak, total activities"
        )
        
        if success and stats:
            print(f"   Level: {stats.get('level', 'N/A')}")
            print(f"   XP: {stats.get('xp', 'N/A')}")
            print(f"   Current Streak: {stats.get('current_streak', 'N/A')}")
            print(f"   Total Activities: {stats.get('total_activities', 'N/A')}")
        
        return stats

    def test_activities(self, categories):
        """Test activities endpoints"""
        print("\n" + "="*50)
        print("TESTING ACTIVITIES")
        print("="*50)
        
        # Get activities
        success, activities = self.run_test(
            "Get Activities",
            "GET",
            "activities",
            200,
            description="Should return list of activities"
        )
        
        if success:
            print(f"   Found {len(activities)} activities")
        
        # Create activity
        if categories:
            study_category = next((cat for cat in categories if cat['name'] == 'Study'), categories[0])
            activity_data = {
                "category_id": study_category['id'],
                "category_name": study_category['name'],
                "date": datetime.now().date().isoformat(),
                "duration": 30,
                "notes": "Test activity for API testing"
            }
            
            success, new_activity = self.run_test(
                "Create Activity",
                "POST",
                "activities",
                200,
                activity_data,
                "Should create new activity and award XP (30 min = 300 XP)"
            )
            
            created_activity_id = None
            if success and new_activity:
                created_activity_id = new_activity.get('id')
                print(f"   Created activity ID: {created_activity_id}")
                print(f"   Expected XP gain: {activity_data['duration'] * 10}")
            
            # Test XP calculation by checking stats again
            success, updated_stats = self.run_test(
                "Get Updated Stats After Activity",
                "GET",
                "stats",
                200,
                description="Should show increased XP and total activities"
            )
            
            if success and updated_stats:
                print(f"   Updated Level: {updated_stats.get('level', 'N/A')}")
                print(f"   Updated XP: {updated_stats.get('xp', 'N/A')}")
                print(f"   Updated Total Activities: {updated_stats.get('total_activities', 'N/A')}")
            
            # Delete activity (cleanup)
            if created_activity_id:
                self.run_test(
                    "Delete Activity",
                    "DELETE",
                    f"activities/{created_activity_id}",
                    200,
                    description="Should delete the test activity"
                )
        
        return activities

    def test_badges(self):
        """Test badges endpoints"""
        print("\n" + "="*50)
        print("TESTING BADGES")
        print("="*50)
        
        success, badges = self.run_test(
            "Get Badges",
            "GET",
            "badges",
            200,
            description="Should return list of badges with earned status"
        )
        
        if success and badges:
            print(f"   Found {len(badges)} badges")
            earned_badges = [badge for badge in badges if badge.get('is_earned')]
            print(f"   Earned badges: {len(earned_badges)}")
            for badge in earned_badges:
                print(f"     - {badge.get('name', 'Unknown')}: {badge.get('description', 'No description')}")
        
        return badges

    def test_analytics(self):
        """Test analytics endpoints"""
        print("\n" + "="*50)
        print("TESTING ANALYTICS")
        print("="*50)
        
        # Test summary analytics
        success, summary = self.run_test(
            "Get Analytics Summary",
            "GET",
            "analytics/summary",
            200,
            description="Should return 30-day summary with category totals"
        )
        
        if success and summary:
            print(f"   Total activities in summary: {summary.get('total_activities', 'N/A')}")
            category_totals = summary.get('category_totals', {})
            print(f"   Category totals: {category_totals}")
        
        # Test daily analytics
        success, daily_data = self.run_test(
            "Get Daily Analytics (7 days)",
            "GET",
            "analytics/daily?days=7",
            200,
            description="Should return daily activity data for last 7 days"
        )
        
        if success and daily_data:
            print(f"   Daily data points: {len(daily_data)}")
        
        # Test daily analytics (30 days)
        success, daily_data_30 = self.run_test(
            "Get Daily Analytics (30 days)",
            "GET",
            "analytics/daily?days=30",
            200,
            description="Should return daily activity data for last 30 days"
        )
        
        if success and daily_data_30:
            print(f"   Daily data points (30 days): {len(daily_data_30)}")
        
        return summary, daily_data

    def test_goals(self):
        """Test goals endpoints"""
        print("\n" + "="*50)
        print("TESTING GOALS")
        print("="*50)
        
        # Get goals
        success, goals = self.run_test(
            "Get Goals",
            "GET",
            "goals",
            200,
            description="Should return list of goals"
        )
        
        if success:
            print(f"   Found {len(goals)} goals")
        
        return goals

def main():
    print("🚀 Starting Progress Tracking App API Tests")
    print("=" * 60)
    
    tester = ProgressTrackingAPITester()
    
    # Test all endpoints
    categories = tester.test_categories()
    stats = tester.test_user_stats()
    activities = tester.test_activities(categories)
    badges = tester.test_badges()
    analytics_summary, daily_data = tester.test_analytics()
    goals = tester.test_goals()
    
    # Print final results
    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Print failed tests
    failed_tests = [test for test in tester.test_results if not test['success']]
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test['name']}: {test.get('error', f'Status {test.get(\"actual_status\", \"unknown\")}')}")
    
    # Print summary of key functionality
    print(f"\n🔍 KEY FUNCTIONALITY CHECK:")
    print(f"   ✅ Categories loaded: {len(categories) if categories else 0}")
    print(f"   ✅ User stats available: {'Yes' if stats else 'No'}")
    print(f"   ✅ Activities system: {'Working' if activities is not None else 'Failed'}")
    print(f"   ✅ Badge system: {'Working' if badges else 'Failed'}")
    print(f"   ✅ Analytics system: {'Working' if analytics_summary else 'Failed'}")
    print(f"   ✅ Goals system: {'Working' if goals is not None else 'Failed'}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())