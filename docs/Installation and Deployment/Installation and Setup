---
title: Installation and Setup
weight: 0
---

# Installation and Setup for developers

Note: This guide is intended for developers who want to run Repco in their local setup. Further instructions for production deployment will be provided at a later date.

## **Prerequisites**

Before you begin, make sure you have the following:

* Git installed on your system
* Access to the Repco repository

## **Step 1: Clone the Repco repository**


1. Open your terminal or command prompt
2. Change the current working directory to the location where you want the cloned directory to be made.
3. Type `git@github.com:openaudiosearch/repco.git` and press Enter. 
4. Wait for the cloning process to complete.

## Step 2: Navigate to the repco repository folder


1. After the cloning process is completed, navigate to the repco repository folder using the following command: `cd repco`

## Step 3: Install the dependencies


1. To install the dependencies, run the following command:

   ```javascript
   yarn && yarn build
   ```

## Step 4: Configure and run repco in Dev-Mode


1. Copy the env file. The defaults are fine for a local setup.

   ```javascript
   cp sample.env .env
   ```
2. Initialize db migrations [requiered]

   ```javascript
   yarn migrate
   ```
3. Start the servers for backend and frontend [optional]

   ```javascript
   yarn server && yarn frontend
   ```
4.  Add a new repo

   ```javascript
   yarn cli repo create default
   ```
5. Add a new datasource for e.g. XRCB

   ```javascript
   yarn cli ds add -r default urn:repco:datasource:xrcb https://xrcb.cat/wp-json/wp/v2
   ```
6. Now you can ingest updates from the xrcb-datasource

   ```javascript
   yarn cli ds ingest
   ```
7.  To prin all revisions in a repo use

   ```javascript
   yarn cli repo log-revisions <repo>
   ```
8. To get revisions over HTTP you can use

   ```javascript
   curl http://localhost:8765/changes
   ```
9. To browse the repo with a GUI check out the frontend

   ```javascript
   http://localhost:3000
   ```