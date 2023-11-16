# Music Library Cloud Backup

A Vite and React-based application for securely backing up your local music library to an AWS S3 bucket. This full-stack solution is designed to provide an easy and efficient way to ensure your music collection is safely stored in the cloud.

## Features

- Vite-based development environment
- React for UI building
- Integration with Express.js for backend support
- Hot module replacement for rapid development
- Configured for TypeScript and Jest testing
- Linting with ESLint and Prettier

## Pre-requisites

- Node version 18.17.1 or higher
  - [Installation instructions](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs)
- PNPM version 7.13.6 or higher
  - [Installation instructions](https://pnpm.io/installation)
  - NPM or Yarn can be used as well, but use PNPM for best results
- PostgreSQL version 14 or higher
  - [Installation instructions](https://www.postgresql.org/download/)

## Installation

To get started, follow these steps:

### Clone the Repository and Install Dependencies

1. Clone the repo locally

```bash
git clone https://github.com/yhafez/music-library-cloud-backup.git music-library-cloud-backup
```

2. Navigate to the cloned repository

```bash
cd music-library-cloud-backup
```

3. Install the dependencies using one of the following commands

```bash
pnpm install
```

```bash
npm install
```

```bash
yarn
```

### Create `.env` File

Rename `.env.sample` to `.env`.

### Create Database and Configure Environment Variables

1. In the PSQL CLI, create a database for your music library backup by running `CREATE DATABASE database_name;`.

1. Create a user and password for your database by running `CREATE USER your_user WITH PASSWORD 'your_password';`

1. Grant database permission to your user by running `GRANT ALL PRIVILEGES ON DATABASE your_database TO your_user;`

1. Add the name of your database as the value for `DB_NAME` and the name of your user for the value of `DB_USER` in the `.env` file.

### Create an S3 Bucket and Configure Environment Variables

1. If you don't already have an AWS account, you'll need to sign up for one at [AWS](https://aws.amazon.com/).

1. Log in to the AWS Management Console and navigate to the S3 service.

1. Click on “Create bucket”.

- Bucket Name: Choose a unique name for your bucket.
- Region: Select the region closest to your users to minimize latency.
- Block all public access: For security, ensure this is enabled unless you have a specific need for public access.
- Other Settings: Adjust according to your needs (like versioning or logging, which are optional).
- Click on “Create”.

4. Add the name of the S3 Bucket as the value of `S3_BUCKET_NAME` in your `.env` file.

### Create an IAM User and Configure Environment Variables

1. Navigate to IAM through the AWS console.

1. Select "Users" under "Access Management".

1. Click "Create User".

1. Provide a unique username and click "Next".

1. Under "Permission Options", select "Attach Policies Directly"

1. Under "Permission Policies", attach the desired permissions for the user. For basic operations, you can use AmazonS3FullAccess, but for finer control, consider creating a custom policy. Click "Next".

1. Review your user set up and confirm that it is as desired, then click "Create User".

1. Back in "Users", select the user you just created.

1. Click "Security Credentials".

1. Under "Access Keys", click "Create Access Key".

1. For "Use Case", select "Local code", then check the confirmation box and click "Next".

1. Give the access key a meaningful description and click "Create access key".

1. Add the access key as the value for `AWS_ACCESS_KEY_ID` and the secret access key provided when you create the access key as the value for `AWS_SECRET_ACCESS_KEY` in your `.env` file.

1. Optional: If needed, you can add a bucket policy for more granular access control. This is usually not necessary for basic operations.

### Configure CORS Access

1. Go to your bucket in the S3 console.

1. Click on the “Permissions” tab.

1. Under "Cross-origin resource sharing (CORS)", click "Edit" and add a CORS policy that allows access from your domain then click "Save Changes". For example:

```
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000"
        ],
        "ExposeHeaders": []
    }
]
```

## Usage

To build the project for production:

```bash
pnpm run build
```

To run the front-end server in development mode:

```bash
pnpm run dev
```

To run the backend server in development mde:

```bash
pnpm run start:backend
```

To run both front-end and back-end servers concurrently in development:

```bash
pnpm run start:dev
```

Navigate to http://localhost:3000/ to use the applicaion.

## Contributing

Contributions to `music-library-cloud-backup` are welcome. If you want to contribute, please follow these steps:

1. Fork the repository.
1. Create a new branch (git checkout -b feature/yourFeature).
1. Make your changes.
1. Commit your changes (git commit -am 'Add some feature').
1. Push to the branch (git push origin feature/yourFeature).
1. Open a pull request.

## Testing

To run tests:

```bash
pnpm run test
```

or

```bash
npm run test
```

or

```bash
yarn run test
```

## Contact

If you have any questions or suggestions, feel free to contact me:

- **Yahya Hafez**
- Email: [yhafez3@gmail.com](mailto:yhafez3@gmail.com)
- LinkedIn: [Yahya Hafez](https://www.linkedin.com/in/yahya-hafez/)
- [Portfolio](https://portfolio-yahya.netlify.app/)

## License

This project is licensed under the [MIT License](LICENSE).

## Issues

For any issues or bugs, please report them on the [issues page](https://github.com/yhafez/fs-vite-scaffold/issues).
