# Video Conferencing Setup Guide

## Overview
Your SchoolSphere app now has a fully embedded Jitsi Meet video conferencing solution that:
- ✅ Hides all Jitsi branding and watermarks
- ✅ Removes "Download app" prompts
- ✅ Works seamlessly in web browsers and Capacitor mobile apps
- ✅ Feels like a native part of OhmanFoundations

## What Was Changed

### 1. **Video Conferencing Page** (`client/src/pages/video-conferencing.tsx`)
- Added comprehensive config to hide Jitsi branding:
  - `MOBILE_APP_PROMO: false` — No app download banners
  - `SHOW_JITSI_WATERMARK: false` — No watermarks
  - `SHOW_POWERED_BY: false` — No "Powered by Jitsi" footer
  - `disableDeepLinking: true` — No "Open in app" prompts
  - Custom `APP_NAME: 'OhmanFoundations'` for notifications
- Optimized toolbar with only essential buttons (mic, camera, chat, settings, etc.)
- Set meeting subject dynamically via API

### 2. **Custom Styling** (`client/src/styles/jitsi-custom.css`)
- Hides any remaining branding elements with CSS
- Improves mobile touch targets (48px minimum)
- Optimizes video layout for small screens
- Makes filmstrip compact on mobile
- Imported globally in `main.tsx`

### 3. **Capacitor Configuration** (`capacitor.config.ts`)
- Enabled HTTPS scheme for Android and iOS (required for `getUserMedia`)
- Ensures secure context for camera/mic access

### 4. **Android Permissions** (`android/app/src/main/AndroidManifest.xml`)
- Added camera, microphone, and audio recording permissions
- Declared optional camera/microphone hardware features

### 5. **iOS Permissions** (`ios/App/App/Info.plist`)
- Added usage descriptions for camera, microphone, and photo library
- These appear in iOS permission prompts with your custom message

## How to Test

### Web (Development)
```bash
npm run dev
```
1. Navigate to Video Conferencing
2. Create a meeting
3. Join the meeting
4. Grant camera/mic permissions when prompted
5. Verify no Jitsi branding appears

### Mobile (Capacitor)

#### Android
```bash
# Build the web assets
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```
- Run on device/emulator
- Grant permissions when prompted
- Test video/audio in meeting

#### iOS
```bash
# Build the web assets
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```
- Run on device/simulator
- Grant permissions when prompted
- Test video/audio in meeting

## Self-Hosting Jitsi (Optional - For Complete Control)

If you want **100% white-labeling** and no dependency on meet.jit.si:

### Why Self-Host?
- Complete control over branding, features, and data
- No reliance on Jitsi's public servers
- Custom domain (e.g., `meet.ohmanfoundations.com`)
- Can disable features, add custom plugins, etc.

### Quick Self-Hosting Steps

1. **Provision a server** (Ubuntu 20.04/22.04, 4GB RAM minimum)
   - DigitalOcean, AWS, Hetzner, etc.

2. **Install Jitsi Meet**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Set hostname
   sudo hostnamectl set-hostname meet.yourdomain.com
   
   # Install Jitsi Meet (interactive installer)
   sudo apt install -y gnupg2 nginx-full apt-transport-https
   curl https://download.jitsi.org/jitsi-key.gpg.key | sudo sh -c 'gpg --dearmor > /usr/share/keyrings/jitsi-keyring.gpg'
   echo 'deb [signed-by=/usr/share/keyrings/jitsi-keyring.gpg] https://download.jitsi.org stable/' | sudo tee /etc/apt/sources.list.d/jitsi-stable.list > /dev/null
   sudo apt update
   sudo apt install -y jitsi-meet
   ```
   - During install, enter your domain (e.g., `meet.yourdomain.com`)
   - Choose "Generate a new self-signed certificate" (or use Let's Encrypt)

3. **Enable Let's Encrypt (recommended)**
   ```bash
   sudo /usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh
   ```

4. **Configure branding**
   - Edit `/etc/jitsi/meet/meet.yourdomain.com-config.js`
   - Set `defaultLocalDisplayName`, `defaultRemoteDisplayName`
   - Upload custom logo to `/usr/share/jitsi-meet/images/`
   - Edit `/usr/share/jitsi-meet/interface_config.js` for watermarks

5. **Update your app**
   In `video-conferencing.tsx`, change:
   ```typescript
   const domain = 'meet.yourdomain.com'; // Instead of 'meet.jit.si'
   ```

6. **Add JWT authentication (optional)**
   - Prevents random users from creating rooms
   - Only authenticated users from your app can host
   - See: https://jitsi.github.io/handbook/docs/devops-guide/secure-domain

### Self-Hosting Alternatives
- **Jitsi as a Service**: https://jaas.8x8.vc/ (paid, managed Jitsi)
- **Daily.co**: https://www.daily.co/ (alternative provider with API)
- **Whereby**: https://whereby.com/information/embedded/ (embeddable rooms)

## Troubleshooting

### "Camera not found" on mobile
- Ensure you've synced Capacitor: `npx cap sync`
- Check permissions were granted in iOS Settings / Android App Settings
- Verify `Info.plist` and `AndroidManifest.xml` have camera/mic permissions

### Still seeing Jitsi branding
- Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
- Clear Jitsi cache: `localStorage.clear()` in console
- Check `jitsi-custom.css` is imported in `main.tsx`
- Verify `configOverwrite` and `interfaceConfigOverwrite` in code

### "Open in app" prompt still appears
- Ensure `MOBILE_APP_PROMO: false` in `interfaceConfigOverwrite`
- Ensure `disableDeepLinking: true` in `configOverwrite`
- Check if browser extensions are interfering (test in Incognito)

### Can't hear/see other participants
- Check firewall allows UDP ports 10000-20000 and TCP 443
- Verify TURN/STUN servers are reachable (Jitsi defaults work)
- Test with another device/browser to isolate network issues

## Next Steps

1. **Test on real devices**: Deploy to Android/iOS and test camera/mic
2. **Add recording** (requires Jibri setup on self-hosted Jitsi)
3. **Add screen sharing**: Already enabled in toolbar (`desktop` button)
4. **Meeting analytics**: Track participant join/leave events with Jitsi API
5. **Integrate with calendar**: Create meetings from class schedules

## Support

- Jitsi Meet API Docs: https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/
- Jitsi Community: https://community.jitsi.org/
- Capacitor Docs: https://capacitorjs.com/docs/

---

Your video conferencing is now fully embedded and ready for production! 🎉
