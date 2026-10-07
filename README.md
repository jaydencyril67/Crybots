# CryBots

Powered by KingsHall

## Environment variables

### Client

Create a `.env` file in the frontend project root with:

```bash
REACT_APP_API_URL=https://kingshalls.onrender.com
```

If you are running the app locally, point `REACT_APP_API_URL` to your local backend instead.

### Server

Create a `.env` file in the backend project root with:

```bash
PORT=3001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_jwt_secret
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=KingsHall <noreply@yourdomain.com>
APP_URL=https://your-frontend-domain.com
```

Notes:
- `RESEND_API_KEY` is required to send confirmation emails.
- `EMAIL_FROM` must be a verified sender in Resend.
- `APP_URL` is used to build the email confirmation link that sends users back to the app.
- `JWT_SECRET` should be a strong random string.
