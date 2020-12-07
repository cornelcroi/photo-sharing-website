# ManBehindLens.com

Your own photosharing site

## Goal

Build a static photosharing site to share your pictures without needing to run, maintain servers.


TODO - create video demo like https://github.com/jpsim/AWSPics



## The architecture

![](public/website/assets/img/manbehindlens.png)

## Tools

- The  [AWS Amplify JavaScript library](https://docs.amplify.aws/), to connect our front end to cloud resources
- [Amazon Cognito](https://aws.amazon.com/cognito/), to handle admin sign up authorization
- [Amazon Simple Storage Service (S3)](https://aws.amazon.com/s3/), to store and serve as many photos as I wish to upload,, to **host the reactjs app** assets for our app and to host the **static generated website**
- [Amazon CloudFront](https://aws.amazon.com/fr/cloudfront/), to store and serve as many photos as our users care to upload, and to host the static assets for our app

- [Amazon DynamoDB](https://aws.amazon.com/dynamodb/), to provide millisecond response times to API queries for album and photo data
- [AWS AppSync](https://aws.amazon.com/appsync/), to host a GraphQL API for our front end
- [AWS Lambda](https://aws.amazon.com/lambda/), to **create photo thumbnails** asynchronously in the cloud & to **generate the static website** on demand
- [Amazon Rekognition](https://aws.amazon.com/rekognition/), to detect 5 labels for each uploaded photo


## Prerequisites
- Create an AWS account
- [Install the Amplify CLI](https://docs.amplify.aws/cli/start/install#install-the-amplify-cli)
- [Configure Amplify](https://docs.amplify.aws/cli/start/install#configure-the-amplify-cli)
- [Install npm](https://www.npmjs.com/get-npm)


## Instructions

**Clone the repository**

```
git clone REPO_URL
```
**Installs the dependencies**
```
npm install
```

**Create [sharp layer](https://aws.amazon.com/blogs/compute/using-lambda-layers-to-simplify-your-development-process) for Lambda**

After the deployment completes, the new Lambda layer is available to use. Run this command to see the available layers:

**Update the layer name and version**

Run `aws lambda list-layers` and look the value of `LayerArn` 

Open the file `amplify/backend/function/S3Triggerac59657c/S3Triggerac59657c-cloudformation-template.json` and put the name and the version number from your AWS account instead of the values found `SHARP_LAYER_NAME` and `SHARP_VERSION`.
```
"Layers": [
          {
            "Fn::Sub": [
              "arn:aws:lambda:${region}:${account}:layer:SHARP_LAYER_NAME:SHARP_VERSION",
              {
                "region": {
                  "Ref": "AWS::Region"
                },
                "account": {
                  "Ref": "AWS::AccountId"
                }
              }
            ]
          }
        ]
```
**Run Amplify commands**

The following command is a one-time initialization step for your Amplify powered cloud app. You run this once 'to connect your app with an AWS backend. This setup helps you with selecting your AWS Profile which would be used to provision cloud resources for your app.
This command will initialize the AWS configuration and create a configuration file at the root of the application.

```
amplify init
```

To provisions cloud resources with the local developments run
```
amplify push
```

Runs amplify push, publishes a static assets to Amazon S3.
Build all your local back-end and front-end resources (if you have a hosting category added) and provision it in the cloud.
```
amplify publish
```

Create an admin user
```
aws cognito-idp sign-up \
  --region YOUR_COGNITO_REGION \
  --client-id YOUR_COGNITO_APP_CLIENT_ID \
  --username admin@example.com \
  --password Passw0rd!
```

```
aws cognito-idp admin-confirm-sign-up \
  --region YOUR_COGNITO_REGION \
  --user-pool-id YOUR_COGNITO_USER_POOL_ID \
  --username admin@example.com
```




## Repository structure 


```bash
.
├── README.md                                                         <-- This file    
├── amplify                                                           <-- Jupyter notebook which provides
│   └── backend                                                       <-- Jupyter notebook which provides  
│       ├── api                                                       <-- Jupyter notebook which provides
│       │   └── photosharing                                          <-- Jupyter notebook which provides
│       ├── auth                                                      <-- Jupyter notebook which provides
│       │   └── photosharing84970f75                                  <-- Jupyter notebook which provides
│       ├── backend-config.json                                       <-- Jupyter notebook which provides
│       ├── boostrap                                                  <-- Jupyter notebook which provides
│       │   └── adminuser                                             <-- Jupyter notebook which provides
│       ├── function                                                  <-- Jupyter notebook which provides
│       │   ├── S3Triggerac59657c                                     <-- Jupyter notebook which provides
│       │   └── StaticWeb59657c                                       <-- Jupyter notebook which provides  
│       ├── hosting                                                   <-- Jupyter notebook which provides
│       │   └── S3AndCloudFront                                       <-- Jupyter notebook which provides
│       ├── storage                                                   <-- Jupyter notebook which provides  
│       │   └── s3871f7e84                                            <-- Jupyter notebook which provides
│       └── tags.json                                                 <-- Jupyter notebook which provides
├── package-lock.json                                                 <-- Jupyter notebook which provides
├── package.json                                                      <-- Jupyter notebook which provides  
├── public                                                            <-- Jupyter notebook which provides  
│   ├── favicon.ico                                                   <-- Jupyter notebook which provides
│   ├── img                                                           <-- Jupyter notebook which provides
│   ├── index.html                                                    <-- Jupyter notebook which provides                             
│   └── website                                                       <-- Jupyter notebook which provides
│       ├── album-item-template.html                                  <-- Jupyter notebook which provides
│       ├── albums-assets                                             <-- Jupyter notebook which provides
│       ├── albums-gallery-1.html                                     <-- Jupyter notebook which provides
│       ├── albums-gallery-template.html                              <-- Jupyter notebook which provides
│       ├── albums-template.html                                      <-- Jupyter notebook which provides  
│       ├── albums.html                                               <-- Jupyter notebook which provides
│       ├── assets                                                    <-- Jupyter notebook which provides
│       ├── gallery-assets                                            <-- Jupyter notebook which provides
│       ├── images                                                    <-- Jupyter notebook which provides
│       ├── index.html                                                <-- Jupyter notebook which provides
│       └── photo-item-template.html                                  <-- Jupyter notebook which provides
├── scripts                                                           <-- Jupyter notebook which provides
├── src                                                               <-- Jupyter notebook which provides
    ├── App.css                                                       <-- Jupyter notebook which provides  
    ├── App.js                                                        <-- Jupyter notebook which provides
    ├── graphql                                                       <-- Jupyter notebook which provides
    ├── index.css                                                     <-- Jupyter notebook which provides  
    ├── index.js                                                      <-- Jupyter notebook which provides
    ├── logo.svg                                                      <-- Jupyter notebook which provides
    ├── reportWebVitals.js                                            <-- Jupyter notebook which provides
    └── setupTests.js                                                 <-- Jupyter notebook which provides
```




## Concept

1. Create ReactJs web application to allow authenticated users to create albums, upload photos and store everything in DynamoDB
2. Put a static website with html template files in a subfolder of reactjs application
and copy it to a subfolder inside /public folder
3. Create AWS Lambda to generate static files using html templates and using  based on data stored in DynamoDB




## Key points

  - full-Stack ReactJs Application developped using AWS Amplify
  - single admin user created at deployment 
  - automatically creating photo thumbnails
  - automatically detecting relevant labels for each uploaded photo and display these labels on album gallery page
  - static website is generated on demand by a AWS Lambda
  - static websit sits in public/website folder
  - 4 html templates
  ```
    /albums-gallery-template.html                                       <-- Jupyter notebook which provides
    /albums-template.html                                               <-- Jupyter notebook which provides
    /album-item-template.html                                           <-- Jupyter notebook which provides
    /photo-item-template.html                                           <-- Jupyter notebook which provides  
  ```
  - each html template contains variable to be replaced by lambda
  ```html
    <div class="ali-caption">
      <h2 class="ali-title">{ALBUM_NAME}</h2>
      <div class="ali-meta">{ALBUM_PHOTOS} photos · {ALBUM_DATE}</div>
    </div>
  ```
  - amplify selected hosting option is S3 with CloudFront using HTTPS
    - the created CloudDistribution points to the root folder of hosting S3 bucket
    - add a second CloudFront distribution to point to ./public/website folder where the static website sits

    

## When to use pre rendered static website

- to change website theme, just replace the content inside /public/website folders
- pre-rendered static HTML of static sites loads much faster than the pages on a dynamic site. Fast websites are really important for a good user experience, and also for boosting your site in search engine rankings.
- Since there are no dynamic scripts running on a static site, and every page is pre-rendered, your site is less likely to go down when there’s a traffic spike.
- Static site generators reduce site complexity. That, in turn, improves speed and reliability, and smooths the developer experience.
- You don’t have to worry about database-toppling traffic spikes.
- you can host your site with a content delivery network that scales with your site’s traffic.


## Costs
Less than a cup of coffee per month



## Credits

[Multiverse HTML template](https://html5up.net/multiverse)
[Lens HTML template](https://html5up.net/lens)
[Build a Photo-Sharing Web App with AWS Amplify Workshop](https://amplify-workshop.go-aws.com/)
[Create sharp layer for AWS Lambda](https://aws.amazon.com/blogs/compute/using-lambda-layers-to-simplify-your-development-process)

