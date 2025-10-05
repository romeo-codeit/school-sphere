# Google Colab Setup for SchoolSphere Database Seeding

## Step 1: Install Node.js in Colab
Run this in a Colab cell:
```bash
!apt-get update
!apt-get install -y nodejs npm
```

## Step 2: Clone the Repository
```bash
!git clone -b feature/production-readiness-audit https://github.com/romeo-codeit/school-sphere.git
%cd school-sphere
```

## Step 3: Install Dependencies
```bash
!npm install
!npm install -g ts-node typescript
```

## Step 4: Set Environment Variables
In a Colab cell, set your Appwrite credentials:
```python
import os
os.environ['VITE_APPWRITE_ENDPOINT'] = 'https://fra.cloud.appwrite.io/v1'
os.environ['VITE_APPWRITE_PROJECT_ID'] = '68bf6163000a013ef62a'
os.environ['VITE_APPWRITE_DATABASE_ID'] = '68bf67ea00188c8c4675'
os.environ['APPWRITE_API_KEY'] = 'your_full_api_key_here'
```

## Step 5: Run the Seeding Script
```bash
!npx ts-node server/seed-appwrite.ts
```

## Notes:
- The seeding script will create the necessary collections and seed exam data.
- It processes the first 5 JSON files by default (for testing). To seed all, edit the script to remove `.slice(0, 5)`.
- Ensure your Appwrite project allows the API key to create collections and documents.
- If you encounter network issues, try running during off-peak hours or check your internet connection.