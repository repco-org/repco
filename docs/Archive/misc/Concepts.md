# Concept and Constarins

This is still WIP 

## Constrains

1. Technical constraints: Repco is built using TypeScript and requires a PostgreSQL database for data storage. It also uses Prisma and Postgraphile for data access and management. This means that the application can only run on environments that support these technologies.

2. Data storage constraints: Repco stores community media content in a centralized database. This means that there are limitations on the size of the media files that can be stored and the amount of storage space available. But it has the capacity P2P options (IPFS) and wants to provide other storage options in the future. 

3. Data replication constraints: Repco replicates community media content between different Repco nodes. The replication process is based on the capabilities of the data sources and the network conditions between the Repco nodes. This means that there may be limitations on the speed and reliability of the replication process.

4. Data source constraints: Repco supports different data sources, but the capabilities of these sources may vary. This means that some data sources may not provide all the features and functionality that Repco requires.

5. Scalability constraints: Repco is designed to be scalable, but there may be limitations on the number of users, the amount of data and the number of requests that the application can handle.

6. Access constraints: Repco provides a public-facing API for accessing community media content. However, the application may have limitations on the number of concurrent users and the number of requests that can be handled.

7. Security constraints: Repco stores and manages sensitive user data, so it must be designed to protect the security and privacy of this data. This will happen througth the concepts of self-authenticating data based on content-addressable storage.

8. Compliance Constraints: Depending on the country or region the application will be used, it may be subject to certain compliance regulations such as GDPR, HIPAA, etc.

## Concept

The concept of Repco is to provide a platform for community media creators to store, manage and distribute their media content. The application allows users to create and manage repositories of community media, and to replicate this content between different Repco nodes. It also provides a public-facing API for accessing community media content.

The application is built using TypeScript and requires a PostgreSQL database for data storage. It also uses Prisma and Postgraphile for data access and management. The application is designed to be scalable, but there may be limitations on the number of users, the amount of data and the number of requests that the application can handle.

Score:

The score of Repco depends on the specific requirements of the project and the success criteria established. However, based on the general goals and constraints described, we can rate the concept of Repco as follows:

Functionality: High. The application provides a centralized platform for community media creators to store, manage and distribute their media content, and allows for easy replication of content between different Repco nodes.

Scalability: Medium. The application is designed to be scalable, but there may be limitations on the number of users, the amount of data and the number of requests that the application can handle.

Security: Medium. The application stores and manages sensitive user data, so it must be designed to protect the security and privacy of this data.

Compliance: Low. It depends on the country or region the application will be used, it may be subject to certain compliance regulations such as GDPR, HIPAA, etc.

User experience: Medium. The application provides an easy-to-use interface for media creators and other stakeholders to manage their content, but the specific usability will depend on the final design.

Maintainability: High. The application is built using TypeScript and requires a PostgreSQL database for data storage, which are widely used and well-documented technologies.

