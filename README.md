# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run setup-db`

Sets up the Supabase database tables and storage buckets for the DigiHealth application. This script will:

1. Delete all existing tables and buckets (use with caution as this will delete all existing data)
2. Create all necessary storage buckets
3. Create all necessary tables with the proper structure
4. Insert sample data for diseases

You can also set up the database through the web interface by:
1. Logging in as an admin user
2. Navigating to `/admin/database-setup`
3. Clicking the "Reset and Setup Database" button

**Note: This operation will delete all existing data in the specified tables and buckets.**

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Database Structure

The DigiHealth application uses the following database structure:

### Tables
- `detailed_profiles`: Stores detailed user profile information
- `profiles`: Stores basic user profile information (for backward compatibility)
- `conditions`: Stores user health conditions
- `medications`: Stores user medications
- `appointments`: Stores user appointments
- `telehealth_consultations`: Stores user telehealth consultations
- `vitals`: Stores user vital signs
- `diseases`: Stores disease information
- `medical_reports`: Stores user medical reports
- `support_tickets`: Stores user support tickets
- `chat_sessions`: Stores user chat sessions
- `chat_messages`: Stores user chat messages
- `alerts`: Stores user health alerts
- `security_settings`: Stores user security settings
- `backup_history`: Stores user backup history

### Storage Buckets
- `profile-pictures`: Stores user profile pictures
- `medical-reports`: Stores user medical reports
- `health-reports`: Stores user health reports
- `chat-attachments`: Stores user chat attachments
- `support-attachments`: Stores user support ticket attachments

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
