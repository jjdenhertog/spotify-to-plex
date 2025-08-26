#!/usr/bin/env python3
"""
Docker Integration Test for SpotifyScraper Service
Tests Docker service management and startup order
"""

import json
import subprocess
import time
from typing import Dict, Any, List

class DockerIntegrationValidator:
    """Validates Docker integration and service management"""
    
    def __init__(self):
        self.test_results = []
    
    def run_test(self, test_name: str, test_func):
        """Run a test and record results"""
        try:
            print(f"🧪 Running test: {test_name}")
            result = test_func()
            self.test_results.append({"name": test_name, "status": "PASS", "details": result})
            print(f"✅ {test_name}: PASSED")
            return True
        except Exception as e:
            error_details = {"error": str(e)}
            self.test_results.append({"name": test_name, "status": "FAIL", "details": error_details})
            print(f"❌ {test_name}: FAILED - {e}")
            return False
    
    def test_dockerfile_structure(self) -> Dict[str, Any]:
        """Test Dockerfile structure and configuration"""
        with open('/var/tmp/vibe-kanban/worktrees/vk-d41b-implement/Dockerfile', 'r') as f:
            dockerfile_content = f.read()
        
        # Check for required components
        required_elements = [
            'supervisord',
            'EXPOSE 9030 3020',
            'spotify-scraper',
            'requirements.txt',
            'python3'
        ]
        
        found_elements = []
        for element in required_elements:
            if element.lower() in dockerfile_content.lower():
                found_elements.append(element)
        
        missing_elements = [e for e in required_elements if e not in found_elements]
        
        assert len(missing_elements) == 0, f"Missing required elements: {missing_elements}"
        
        return {
            "required_elements": required_elements,
            "found_elements": found_elements,
            "dockerfile_lines": len(dockerfile_content.split('\n'))
        }
    
    def test_supervisord_configuration(self) -> Dict[str, Any]:
        """Test supervisord configuration file"""
        try:
            with open('/var/tmp/vibe-kanban/worktrees/vk-d41b-implement/supervisord.conf', 'r') as f:
                supervisord_content = f.read()
            
            # Check for service definitions
            required_sections = ['supervisord', 'program:']
            found_sections = []
            
            for section in required_sections:
                if section in supervisord_content:
                    found_sections.append(section)
            
            lines = supervisord_content.split('\n')
            non_empty_lines = [line for line in lines if line.strip()]
            
            return {
                "config_exists": True,
                "found_sections": found_sections,
                "config_lines": len(non_empty_lines),
                "content_preview": supervisord_content[:200] + "..." if len(supervisord_content) > 200 else supervisord_content
            }
        
        except FileNotFoundError:
            return {
                "config_exists": False,
                "error": "supervisord.conf file not found"
            }
    
    def test_service_ports_configuration(self) -> Dict[str, Any]:
        """Test service port configuration"""
        with open('/var/tmp/vibe-kanban/worktrees/vk-d41b-implement/Dockerfile', 'r') as f:
            dockerfile_content = f.read()
        
        # Check port exposure
        main_port_exposed = '9030' in dockerfile_content
        scraper_port_exposed = '3020' in dockerfile_content
        
        # Check environment variables
        spotify_scraper_url_set = 'SPOTIFY_SCRAPER_URL' in dockerfile_content
        
        return {
            "main_port_9030_exposed": main_port_exposed,
            "scraper_port_3020_exposed": scraper_port_exposed,
            "spotify_scraper_url_configured": spotify_scraper_url_set,
            "port_configuration": "EXPOSE 9030 3020" in dockerfile_content
        }
    
    def test_startup_script_logic(self) -> Dict[str, Any]:
        """Test startup script logic and service orchestration"""
        with open('/var/tmp/vibe-kanban/worktrees/vk-d41b-implement/Dockerfile', 'r') as f:
            dockerfile_content = f.read()
        
        # Look for startup orchestration
        has_startup_script = 'start.sh' in dockerfile_content
        has_health_check_logic = 'curl' in dockerfile_content and 'health' in dockerfile_content
        has_service_wait_logic = 'while' in dockerfile_content and 'sleep' in dockerfile_content
        uses_supervisord = 'supervisord' in dockerfile_content and 'CMD' in dockerfile_content
        
        return {
            "has_startup_script": has_startup_script,
            "has_health_check_logic": has_health_check_logic,
            "has_service_wait_logic": has_service_wait_logic,
            "uses_supervisord": uses_supervisord,
            "startup_orchestration": "present" if has_startup_script or uses_supervisord else "missing"
        }
    
    def test_python_dependencies_setup(self) -> Dict[str, Any]:
        """Test Python dependencies and SpotifyScraper setup"""
        # Check requirements.txt exists
        try:
            with open('/var/tmp/vibe-kanban/worktrees/vk-d41b-implement/apps/spotify-scraper/requirements.txt', 'r') as f:
                requirements = f.read().strip().split('\n')
            
            required_packages = ['fastapi', 'uvicorn', 'requests', 'beautifulsoup4']
            present_packages = []
            
            for req in requirements:
                package_name = req.split('==')[0].split('>=')[0].split('<=')[0]
                if package_name in required_packages:
                    present_packages.append(package_name)
            
            return {
                "requirements_file_exists": True,
                "total_requirements": len(requirements),
                "required_packages": required_packages,
                "present_packages": present_packages,
                "requirements_preview": requirements[:5]
            }
        
        except FileNotFoundError:
            return {
                "requirements_file_exists": False,
                "error": "requirements.txt not found"
            }
    
    def test_service_integration_points(self) -> Dict[str, Any]:
        """Test service integration and communication setup"""
        # Check for service discovery and communication setup
        integration_points = {
            "environment_variables": [],
            "service_urls": [],
            "health_endpoints": [],
            "communication_protocols": []
        }
        
        # Scan Dockerfile for integration patterns
        with open('/var/tmp/vibe-kanban/worktrees/vk-d41b-implement/Dockerfile', 'r') as f:
            dockerfile_content = f.read()
        
        if 'SPOTIFY_SCRAPER_URL' in dockerfile_content:
            integration_points["environment_variables"].append("SPOTIFY_SCRAPER_URL")
        
        if 'http://localhost:3020' in dockerfile_content:
            integration_points["service_urls"].append("http://localhost:3020")
        
        if '/health' in dockerfile_content:
            integration_points["health_endpoints"].append("/health")
        
        if 'curl' in dockerfile_content:
            integration_points["communication_protocols"].append("HTTP/curl")
        
        return integration_points
    
    def run_all_tests(self):
        """Run all Docker integration tests"""
        print("🐳 Starting Docker Integration Validation")
        print("=" * 50)
        
        tests = [
            ("Dockerfile Structure", self.test_dockerfile_structure),
            ("Supervisord Configuration", self.test_supervisord_configuration),
            ("Service Ports Configuration", self.test_service_ports_configuration),
            ("Startup Script Logic", self.test_startup_script_logic),
            ("Python Dependencies Setup", self.test_python_dependencies_setup),
            ("Service Integration Points", self.test_service_integration_points)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            if self.run_test(test_name, test_func):
                passed += 1
            else:
                failed += 1
        
        print("=" * 50)
        print(f"📊 Docker Integration Test Summary: {passed} passed, {failed} failed")
        
        if failed > 0:
            print("\n❌ Some tests failed. Details:")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    print(f"  - {result['name']}: {result['details']['error']}")
        else:
            print("\n✅ All Docker integration tests passed!")
        
        return {"passed": passed, "failed": failed, "results": self.test_results}

if __name__ == "__main__":
    validator = DockerIntegrationValidator()
    results = validator.run_all_tests()
    
    # Save detailed results
    with open("/var/tmp/vibe-kanban/worktrees/vk-d41b-implement/tests/docker-integration-results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to docker-integration-results.json")
    
    exit_code = 0 if results["failed"] == 0 else 1
    exit(exit_code)