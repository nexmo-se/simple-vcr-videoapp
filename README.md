This app launches a simple one-to-one video conference using Video Express.

## 📚 Dependencies
- [Vonage Video Express](https://tokbox.com/developer/video-express/)

## 🛠 Setup
1. Create a [Tokbox account](https://tokbox.com/account/) and create a new project with the type "Vonage Video API".
2. This is a VCR project. Copy `neru.sample.yml`. Rename it to `neru.yml` and fill in the information accordingly.

## ▶️ Run Project
1. Run `neru deploy` to deploy the project instance.

## 🗒 Extra Notes
1. For instant login to a room, you can pass in query parameters:
    1. `userName`: The participant name; e.g. `userName=User%20Name`
    2. `roomName`: The room name you want to join; e.g. `roomName=room123`