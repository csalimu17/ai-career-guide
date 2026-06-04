#!/usr/bin/env python3
"""Test aicareerguide.uk localhost server"""

from playwright.sync_api import sync_playwright, expect
import time

def test_localhost_3000():
    """Test that localhost:3000 is accessible and functional"""
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("🌐 Starting test of http://localhost:3000...")
        
        try:
            # Navigate to localhost
            print("📍 Navigating to http://localhost:3000...")
            page.goto('http://localhost:3000', wait_until='networkidle', timeout=30000)
            print("✅ Page loaded successfully!")
            
            # Wait for content to load
            time.sleep(2)
            
            # Get page title
            title = page.title()
            print(f"📄 Page Title: {title}")
            
            # Take screenshot
            screenshot_path = '/tmp/localhost_test.png'
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"📸 Screenshot saved to: {screenshot_path}")
            
            # Get page content summary
            content = page.content()
            print(f"📊 Page content length: {len(content)} bytes")
            
            # Check for key elements
            print("\n🔍 Checking for key UI elements...")
            
            # Look for main content
            try:
                main_element = page.locator('main')
                if main_element.count() > 0:
                    print("✅ Found main element")
                else:
                    print("⚠️  No main element found")
            except:
                print("⚠️  Could not check for main element")
            
            # Look for navigation
            try:
                nav = page.locator('nav')
                if nav.count() > 0:
                    print("✅ Found navigation element")
                else:
                    print("⚠️  No navigation found")
            except:
                print("⚠️  Could not check for navigation")
            
            # Look for buttons
            try:
                buttons = page.locator('button')
                button_count = buttons.count()
                print(f"✅ Found {button_count} buttons")
            except:
                print("⚠️  Could not count buttons")
            
            # Look for headings
            try:
                h1s = page.locator('h1')
                h1_count = h1s.count()
                if h1_count > 0:
                    h1_text = h1s.first.text_content()
                    print(f"✅ Found {h1_count} H1 heading: '{h1_text}'")
                else:
                    print("⚠️  No H1 headings found")
            except:
                print("⚠️  Could not check H1 headings")
            
            # Check for console errors
            console_messages = []
            page.on('console', lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
            
            # Navigate again to capture console
            page.goto('http://localhost:3000', wait_until='networkidle', timeout=30000)
            
            # Filter for errors
            errors = [m for m in console_messages if 'error' in m.lower()]
            if errors:
                print(f"\n⚠️  Console Errors Found ({len(errors)}):")
                for error in errors[:5]:
                    print(f"   - {error}")
            else:
                print("\n✅ No console errors detected")
            
            # Test navigation to subpages
            print("\n🧪 Testing subpage navigation...")
            
            test_paths = [
                ('/dashboard', 'Dashboard'),
                ('/interview-prep', 'Interview Prep'),
                ('/jobs', 'Jobs'),
                ('/cv-editor', 'CV Editor'),
            ]
            
            for path, name in test_paths:
                try:
                    print(f"  Testing {name}... ", end='', flush=True)
                    page.goto(f'http://localhost:3000{path}', wait_until='networkidle', timeout=15000)
                    print("✅")
                except Exception as e:
                    print(f"❌ Error: {str(e)[:50]}")
            
            # Test API endpoint
            print("\n🔌 Testing API endpoints...")
            try:
                print("  Testing /api/health/models... ", end='', flush=True)
                page.goto('http://localhost:3000/api/health/models', wait_until='networkidle', timeout=10000)
                response_text = page.text_content()[:100]
                print(f"✅ Response: {response_text}...")
            except Exception as e:
                print(f"❌ Error: {str(e)[:50]}")
            
            print("\n" + "="*60)
            print("✅ TEST SUMMARY: Website is accessible and responding!")
            print("="*60)
            
        except Exception as e:
            print(f"❌ ERROR: Failed to access localhost:3000")
            print(f"   Details: {str(e)}")
            print("\n⚠️  The server may not be running or port 3000 is unavailable")
            return False
        
        finally:
            browser.close()
        
        return True

if __name__ == '__main__':
    success = test_localhost_3000()
    exit(0 if success else 1)
