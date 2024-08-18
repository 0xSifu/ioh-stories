import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';

// Define metrics
const userCreationTrend = new Trend('user_creation_duration');
const userSignInTrend = new Trend('user_signin_duration');
const storyCreationTrend = new Trend('story_creation_duration');

// API Endpoints
const signupEndpoint = 'http://localhost:9001/api/v1/auth/signup';
const signinEndpoint = 'http://localhost:9001/api/v1/auth/login';
const storyEndpoint = 'http://localhost:8002/api/v1/story';

// Configuration
const numberOfUsers = 100;
const password = '12345';

// Helper functions
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}

function generateRandomUserData(index: number) {
  return {
    email: `user${index}_${generateRandomString(5)}@example.com`,
    username: `user${index}_${generateRandomString(5)}`,
    password: password
  };
}

// User data
const users = [];
for (let i = 0; i < numberOfUsers; i++) {
  const userData = generateRandomUserData(i);

  const signupRes = http.post(signupEndpoint, JSON.stringify({
    email: userData.email,
    username: userData.username,
    password: userData.password
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(signupRes, { 'Signup status is 201': (r) => r.status === 201 });
  userCreationTrend.add(signupRes.timings.duration);

  const signinRes = http.post(signinEndpoint, JSON.stringify({
    email: userData.email,
    password: userData.password
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(signinRes, { 'SignIn status is 200': (r) => r.status === 200 });
  userSignInTrend.add(signinRes.timings.duration);

  const token = JSON.parse(signinRes.body as string).token;
  users.push(token);
}

export const options = {
  stages: [
    { duration: '1m', target: numberOfUsers }, // Ramp-up to 100 users
    { duration: '5m', target: numberOfUsers }, // Stay at 100 users
    { duration: '1m', target: 0 },              // Ramp-down to 0 users
  ],
};

export default function () {
  group('Create Stories with All Tokens', () => {
    for (const token of users) {
      const storyRes = http.post(storyEndpoint, JSON.stringify({
        userId: '66bef7b20d9aacf5a4bc59b5',  // Replace with actual user ID if needed
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

      // Optional: Sleep to avoid hitting the server too hard
      sleep(1);
    }
  });
}
