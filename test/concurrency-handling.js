import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Define metrics
const storyCreationTrend = new Trend('story_creation_duration');
const storyUpdateTrend = new Trend('story_update_duration');
const storyCreationFailRate = new Rate('story_creation_fail_rate');
const storyUpdateFailRate = new Rate('story_update_fail_rate');

// API Endpoints
const signupEndpoint = 'http://localhost:9001/api/v1/auth/signup';
const signinEndpoint = 'http://localhost:9001/api/v1/auth/login';
const storyEndpoint = 'http://localhost:8002/api/v1/story';

// Configuration
const numberOfUsers = 100;
const password = '12345';

// Helper functions
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}

function generateRandomUserData(index) {
  return {
    email: `user${index}_${generateRandomString(5)}@example.com`,
    username: `user${index}_${generateRandomString(5)}`,
    password: password
  };
}

export const options = {
  stages: [
    { duration: '1m', target: numberOfUsers }, // Ramp-up to 100 users
    { duration: '5m', target: numberOfUsers }, // Stay at 100 users
    { duration: '1m', target: 0 },              // Ramp-down to 0 users
  ],
};

export default function () {
  group('Create Users and Sign In', function () {
    const tokens = [];
    const userIds = [];
    
    for (let i = 0; i < numberOfUsers; i++) {
      const userData = generateRandomUserData(i);

      // Sign up user
      const signupRes = http.post(signupEndpoint, JSON.stringify({
        email: userData.email,
        username: userData.username,
        password: userData.password
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
      check(signupRes, { 'Signup status is 200': (r) => r.status === 200 });

      // Sign in user
      const signinRes = http.post(signinEndpoint, JSON.stringify({
        email: userData.email,
        password: userData.password
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
      check(signinRes, { 'SignIn status is 200': (r) => r.status === 200 });

      const signinBody = JSON.parse(signinRes.body);
      const token = signinBody.data.accessToken;
      const userId = signinBody.data.user.id;
      tokens.push(token);
      userIds.push(userId);

      sleep(1);
    }

    group('Create Stories with All Tokens', function () {
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const userId = userIds[i];
        
        // Create a story
        const storyRes = http.post(storyEndpoint, JSON.stringify({
          userId: userId,
          content: 'Test Story from IOH should be great!',
          media: [
            'https://example.com/media1.jpg',
            'https://example.com/media2.jpg',
            'https://example.com/media3.jpg'
          ]
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        check(storyRes, { 'Create story status is 201': (r) => r.status === 201 });
        storyCreationTrend.add(storyRes.timings.duration);
        storyCreationFailRate.add(storyRes.status !== 201);

        const storyBody = JSON.parse(storyRes.body);
        const storyId = storyBody.data.id;

        // Update the story
        const updateRes = http.put(`${storyEndpoint}/${storyId}`, JSON.stringify({
          content: 'Updated content for the story!',
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        check(updateRes, { 'Update story status is 200': (r) => r.status === 200 });
        storyUpdateTrend.add(updateRes.timings.duration);
        storyUpdateFailRate.add(updateRes.status !== 200);

        sleep(1);
      }
    });
  });
}
