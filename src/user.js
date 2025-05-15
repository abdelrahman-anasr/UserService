import { gql } from 'apollo-server-express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { fetchRole, fetchId, checkAuth }from '../auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {Kafka , Partitioners , logLevel} from "kafkajs";
import { DateTimeResolver } from "graphql-scalars";
import { type } from 'os';
import { create } from 'domain';
import { time } from 'console';
import { json } from 'stream/consumers';
import * as fs from 'fs';
import * as path from 'path';
import { createWriteStream } from 'fs';
import { GraphQLUpload } from 'graphql-upload';
import * as dotenv from 'dotenv';

dotenv.config();
const {typeDefs , resolvers} = await (async function() {


  const kafka = new Kafka({
    clientId: "UserService",
    brokers: [process.env.KAFKA_URL],
  });

    const producer = kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner
  });
  const consumer = kafka.consumer({ groupId: "UserService"});

  const shareUserDetails = async (user) => {
    await producer.connect();
    const subsetUser = {id: user.universityId, email: user.email};
    console.log("Subset user is: " + subsetUser);
    await producer.send({
      topic: "user-details",
      messages: [{
        key: user.universityId.toString(),
        value: JSON.stringify(subsetUser)
      }]
    });
    console.log("Sent!");
    await producer.disconnect();
  };

  const shareUserGenderDetails = async (user) => {
    await producer.connect();
    const subsetUser = {id: user.universityId , gender: user.gender};
    await producer.send({
      topic: "user-gender-details",
      messages: [{
        key: user.universityId.toString(),
        value: JSON.stringify(subsetUser)
      }]
    });
    console.log("Sent!");
    await producer.disconnect();
  };

  const sendAccountCreationNotification = async (user) => {
    await producer.connect();
    await producer.send({
      topic: "notificationRequests",
      messages: [{
        key: user.universityId.toString(),
        value: JSON.stringify({request: "Account Creation" , subject : "Account Creation" , message : "Your account has been created . Please Follow the Following Link to verify: {Placeholder Link}" , userId : user.universityId})
      }]
    });
    console.log("Sent!");
    await producer.disconnect();
  };

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const shareCarInfo = async (car) => {
    await producer.connect();
    const subsetCar = {id: car.id , universityId : car.DriverId , seats: car.seats};
    await producer.send({
        topic: "car-info",
        messages: [{
            key: car.id.toString(),
            value: JSON.stringify(subsetCar)
        }]
    });
    console.log("Sent!");
    await producer.disconnect();
}

  await consumer.connect();
  await consumer.subscribe({ topics: ["user-details" , "user-created"] , fromBeginning: true});
  
  await consumer.run({
    eachMessage: async ({ topic, partition, message, heartbeat, pause }) => { }
  })

  const typeDefs = gql`
  scalar Upload
  scalar DateTime

    enum RequestType {
    STUDENT
    DRIVER
  }

  enum RequestStatus {
    PENDING
    APPROVED
    REJECTED
  }

  enum Role {
    admin
    driver
    student
  }

  type Car {
    id: ID!
    DriverId: String!
    carModel: String!
    carModelYear: String!
    seats: Int!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    universityId: String!
    gender: String!
    phoneNumber: String
    isEmailVerified: Boolean!
    role: Role!
    createdAt: String
    updatedAt: String
  }

  type Miniusers {
    universityId: String!
    name: String!
  }

  type AdminResponse {
    id: Int!
    complaintId: Int!
    Subject: String!
    Message: String!
    createdAt: String!
  }

  type Complaint {
    id: Int!
    universityId: String!
    Subject: String!
    Message: String!
    createdAt: String!
  }

  type Request {
  id: ID!
  studentId: String!
  universityId: String!
  requestType: RequestType!
  status: RequestStatus!
  createdAt: String!
  reviewedAt: String
  licenseURL: String
  }

  type AccountRequest {
    id: Int!
    universityId: String!
    name: String!
    email: String!
    gender: String!
    phoneNumber: String!
    password: String!
    createdAt: String!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    complaints: [Complaint!]!
    fetchUnrespondedComplaints: [Complaint]!
    fetchMyDetails: User
    complaint(id: Int!): Complaint
    complaintsByUser(userId: Int!): [Complaint!]!
    accountRequests: [AccountRequest]
    accountRequest(id: Int!): AccountRequest
    Miniusers: [Miniusers!]!
    rejectAccountRequest(id: Int!): AccountRequest!
    adminResponses: [AdminResponse]!
    fetchMyComplaints: [Complaint]!
    fetchAdminResponsesForMyComplaints: [AdminResponse]!
    adminResponse(id: Int!): AdminResponse
    fetchAdminResponsesByUser: [AdminResponse]!
    cars: [Car!]!
    car(id: ID!): Car
    requests: [Request!]!
    request(id: ID!): Request
    rejectRequest(id: ID!): Request!
  }
 type LoginResponse {
    token: String!
  }
  type Mutation {
    createUser(
      name: String!
      email: String!
      universityId: String!
      password: String!
      phoneNumber: String
      role: Role
    ): User!
    login(email: String!, password: String!): LoginResponse!
    updateUser(
    id: ID!
    name: String
    email: String
    universityId: String
    phoneNumber: String
    role: Role
    isEmailVerified: Boolean
    isPhoneVerified: Boolean
    isDriverApproved: Boolean
    isStudentApproved: Boolean
  ): User!


  createRequest( universityId: String! ,file: Upload ): Request!

  updateRequest( id: ID! ,status: RequestStatus ,reviewedAt: String): Request!

  acceptRequest(id: ID!): Car!

  deleteRequest(id: ID!): Boolean!
updateMyUser(name: String , email: String , universityId: String , phoneNumber: String, isPhoneVerified: Boolean , isDriverApproved: Boolean , isStudentApproved: Boolean): User!
createAdminResponse(complaintId: Int! , Subject: String! , Message: String!): AdminResponse!
deleteUser(id: ID!): Boolean!
createComplaint(Subject: String! , Message: String!): Complaint!
deleteComplaint(id: ID!): Complaint!
createAccountRequest(universityId: Int! , name: String! , gender: String! , email: String! , phoneNumber: String! , password: String!): AccountRequest!
acceptAccountRequest(id: Int!): User!
createCar(
  DriverId: String!
  carModel: String!
  carModelYear: String!
  seats: Int!
): Car!
}

`;

async function saveUploadedFile(file) {
  // Ensure file contains the expected properties (createReadStream, filename, mimetype)
  const { createReadStream, filename, mimetype } = await file;

  // Define the upload directory path
  const uploadDir = path.join(process.cwd(), 'uploads', 'licenses');

  // Create the upload directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Generate a unique filename to avoid collisions
  const uniqueFilename = `${Date.now()}-${filename}`;
  const filePath = path.join(uploadDir, uniqueFilename);
  const fileUrl = `/uploads/licenses/${uniqueFilename}`;

  // Create a write stream to save the file on the server
  const writeStream = createWriteStream(filePath);

  // Create a read stream from the uploaded file
  const stream = createReadStream();

  // Pipe the file data to the server
  await new Promise((resolve, reject) => {
    stream.pipe(writeStream).on('finish', resolve).on('error', reject);
  });

  return fileUrl;
}


const resolvers = {
  Upload: GraphQLUpload, // Enable handling of file uploads
  DateTime : DateTimeResolver,
  //find users
  Query: {
    users: async (_, __, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req))) {
        throw new Error("Unauthorized");
      }
      return await prisma.user.findMany();
    },
    //find user by id
    user: async (_, { id }, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      return await prisma.user.findUnique({ where: { id } });
    },
    fetchMyDetails: async (_, __, { req , res }) => {
      console.log("Request Cookies is: " + JSON.stringify(req.headers.cookie));
      console.log("Request Cookies is: " + JSON.stringify(req.headers.cookie)); 
      
      if (!checkAuth(["admin" , "driver" , "student"], fetchRole(req.headers.cookie)))
      {
        console.log("Throwing error");
        throw new Error("Unauthorized");
      }

      const user = await prisma.user.findUnique({
        where: {
          universityId : fetchId(req.headers.cookie).toString()
        }
      });
      if(user === null)
        throw new Error("User not found");

      console.log("User is: " + JSON.stringify(user));
      return user;
    },
    Miniusers: async (_, __, { req , res }) => {
      if (!checkAuth(["admin" , "driver" , "student"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      return await prisma.miniusers.findMany();
    },
    complaints: async (_, __, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      return await prisma.complaint.findMany();
    },
    fetchUnrespondedComplaints: async (_ , __ , {req , res}) => {
      if(!checkAuth(["admin"] , fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      const complaints = await prisma.complaint.findMany();

      const adminResponses = await prisma.adminResponse.findMany();

      const adminResponsesComplaintIds = [];

      const adminResponsesToReturn = [];

      adminResponses.forEach(adminResponse => {
        adminResponsesComplaintIds.push(adminResponses.universityId);
      })

      for(let i = 0 ; i < complaints.length ; i++)
      {
        if(!adminResponsesComplaintIds.includes(complaints[i].id))
        {
          adminResponsesToReturn.push(complaints[i]);
        }
      }

      return adminResponsesToReturn;
    },
    fetchMyComplaints: async (_ , __ , {req , res}) => {
      if(!checkAuth(["admin" , "driver", "student"] , fetchRole(req.headers.cookie)))
      {
        throw new Error("Unauthorized");
      }
      const userId = fetchId(req.headers.cookie);
      const complaints = await prisma.complaint.findMany({
        where:
          {
            universityId: userId.toString()
          }
      });

      return complaints;
    },
    fetchAdminResponsesForMyComplaints: async (_ , __ , {req , res}) => {
      if(!checkAuth(["admin" , "driver", "student"] , fetchRole(req.headers.cookie)))
      {
        throw new Error("Unauthorized");
      }
      const userId = fetchId(req.headers.cookie);
      const complaints = await prisma.complaint.findMany({
        where:
          {
            universityId: userId.toString()
          }
      });

      const complaintIds = [];

      complaints.forEach(complaint => {
        complaintIds.push(complaint.id);
      })

      const adminResponses = await prisma.adminResponse.findMany();

      const adminResponsesToReturn = [];

      for(let i = 0 ; i < adminResponses.length ; i++)
      {
        if(!complaintIds.includes(adminResponses[i].complaintId))
        {
          adminResponsesToReturn.push(adminResponses[i]);
        }
      }

      return adminResponsesToReturn;
    },
    complaint: async (_, { id }, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      const complaint = await prisma.complaint.findUnique({ where: { id } });
      if(complaint === null)
        throw new Error("Complaint not found");
      return complaint;
    },
    complaintsByUser: async (_, { userId }, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      return await prisma.complaint.findMany({ where: { userId : userId } });
    },
    adminResponses: async (_, __, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      return await prisma.adminResponse.findMany();
    },
    adminResponse: async (_, { id }, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      const adminResponse = await prisma.adminResponse.findUnique({ where: { id } });
      if(adminResponse === null)
        throw new Error("Admin response not found");
      return adminResponse;
    },
    rejectAccountRequest: async (_, { id }, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      const accountRequest = await prisma.accountRequest.findUnique({
        where: {
          id : id
        }
      });
      if(accountRequest === null)
        throw new Error("Account request not found");
      if(accountRequest.status !== "Pending")
        throw new Error("Account request is not pending");
      const updatedRequest = await prisma.accountRequest.update({
        where: {
          id : id
        },
        data : {
          status : "Rejected"
        }
      });
      return updatedRequest;
    },
    fetchAdminResponsesByUser: async (_, args, { req , res }) => {
      if (!checkAuth(["admin" , "driver" , "student"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      const id = fetchId(req.headers.cookie);
      return await prisma.adminResponse.findMany({
        where: {
          userId : id
        }
      });
    },
    accountRequests: async (_, args, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      return await prisma.accountRequest.findMany();
    },
    accountRequest: async (_, { id }, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      const accountRequest = await prisma.accountRequest.findUnique({ where: { id } });
      if(accountRequest === null)
        throw new Error("Account request not found");
      return accountRequest;
    },
    cars: async (_, __, { req , res }) => {
      if (!checkAuth(['admin' , 'driver' , 'student'], fetchRole(req.headers.cookie))) {
        throw new Error('Unauthorized');
      }
      return await prisma.car.findMany();
    },
    car: async (_, { id }, { req , res }) => {
      if (!checkAuth(['admin'], fetchRole(req.headers.cookie))) {
        throw new Error('Unauthorized');
      }
      return await prisma.car.findUnique({ where: { id } });
    },
    requests: async (_, __, { req , res }) => {
      if (!checkAuth(['admin'], fetchRole(req.headers.cookie))) {
        throw new Error('Unauthorized');
      }
      return await prisma.request.findMany();
    },

    request: async (_, { id }, { req , res }) => {
      if (!checkAuth(['admin'], fetchRole(req.headers.cookie))) {
        throw new Error('Unauthorized');
      }
      return await prisma.request.findUnique({ where: { id } });
    },
    rejectRequest: async (_ , { id } , { req , res }) => {
      if(!checkAuth(["admin"] , fetchRole(req.headers.cookie)))
        throw new Error("Unauthorized");
      else
      {
        const request = await prisma.request.findUnique({
          where: {
            id : id
          }
        });
        if(request === null)
          throw new Error("Request not found");
        if(request.status === "ACCEPTED" || request.status === "REJECTED")
          throw new Error("Request is already approved");
        const updatedRequest = await prisma.request.update({
          where: {
            id : id
          },
          data : {
            status : "REJECTED"
          }
        });
        return updatedRequest;
      }
    }
  },
  Mutation: {
    createAdminResponse: async (_, args, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      return await prisma.adminResponse.create({
        data : {
          complaintId : args.complaintId,
          Subject : args.Subject,
          Message : args.Message,
          createdAt : new Date().toISOString()
        }
      });
    },
    //create user
    createUser: async (_, args, { req , res }) => {
      if (!checkAuth(["admin"] , fetchRole(req.headers.cookie))) {
        console.log("Role: ", role);
        console.log("Roles Authorized: ", ["ADMIN"]);
        console.log(checkAuth(["ADMIN"], role));
        throw new Error("Unauthorized");
      }
      const hashedPassword = await bcrypt.hash(args.password, 10);
      const user =await prisma.user.create({
        data: {
          ...args,
          password: hashedPassword,
        },
      });

      shareUserDetails(user);
      sendAccountCreationNotification(user);
      return user;
    },
    updateMyUser: async (_, args, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      
      const user = await prisma.user.findFirst({
        where: {
          universityId : fetchId(req.headers.cookie)
        }
      });
      if(user === null)
        throw new Error("User not found");
      const updatedUser = await prisma.user.update({
        where: {
          universityId : fetchId(req.headers.cookie)
        },
        data : {
          name : args.name,
          email : args.email,
          universityId : args.universityId,
          gender : args.gender,
          phoneNumber : args.phoneNumber,
          isEmailVerified : args.isEmailVerified,
        }
      });
      return updatedUser;
    },
    createAccountRequest: async (_, args, { req , res }) => {
      const requestsWithSameUniversityId = await prisma.accountRequest.findMany({
        where: {
          universityId : args.universityId
        }
      });
      const requestsWithSameEmail = await prisma.accountRequest.findMany({
        where: {
          email : args.email
        }
      });
      if(requestsWithSameUniversityId.length > 0 || requestsWithSameEmail.length > 0)
        throw new Error("You have already made a request for an account");
      const hashedPassword = await bcrypt.hash(args.password, 10);
      return await prisma.accountRequest.create({
        data : {
          universityId : args.universityId,
          name : args.name,
          email : args.email,
          gender : args.gender,
          phoneNumber : args.phoneNumber,
          password : hashedPassword,
          status : "Pending",
          createdAt : new Date().toISOString()
        }
      });
    },
    acceptAccountRequest: async (_, { id }, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      const accountRequest = await prisma.accountRequest.findUnique({
        where: {
          id : id
        }
      });
      if(accountRequest === null)
        throw new Error("Account request not found");
      if(accountRequest.status === "Approved")
        throw new Error("Account request is already approved");
      await prisma.accountRequest.update({
        where: {
          id : id
        },
        data : {
          status : "Approved"
        }
      });
      const user =  await prisma.user.create({
        data : {
          name : accountRequest.name,
          email : accountRequest.email,
          gender : accountRequest.gender,
          universityId : accountRequest.universityId.toString(),
          phoneNumber : accountRequest.phoneNumber,
          password : accountRequest.password,
          isEmailVerified : false,
          role : "student",
          createdAt : new Date().toISOString(),
          updatedAt : new Date().toISOString()
        }
      });


      let unique = false;
  let accountCode;
  while (!unique) {
    accountCode = Math.floor(100000 + Math.random() * 900000); 
    const exists = await prisma.approval.findUnique({
      where: { accountCode }
    });
    if (!exists) unique = true;
  }

  await prisma.approval.create({
    data: {
      userId: user.id,
      accountCode: accountCode
    }
  });
      const miniuser = await prisma.miniusers.create({
        data : {
          universityId : user.universityId,
          name : user.name
        }
      });
      await shareUserDetails(user);
      await new Promise(r => setTimeout(r, 2000));
      await sendAccountCreationNotification(user);
      await shareUserGenderDetails(user);
      return user;
    },
    //login user
    login:async(_, { email, password } , {req , res}) => {
     console.log("Entered login function");
      const user= await prisma.user.findUnique({ where: { email } });
      console.log(user);

      if (!user) {
        throw new Error("User not found");
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error("Invalid credentials");
      }
      console.log("Secret key is:" + process.env.JWT_SECRET_KEY);
      const token = jwt.sign({ id: Number(user.universityId), role: user.role }, process.env.JWT_SECRET_KEY, { 
        expiresIn: '1h',
      });
      res.cookie('Authorization', token, {
        httpOnly: true,
        sameSite: 'None',
        domain: 'railway.app',
        secure: true
      });
      return { token , role: user.role };
    },
    //update user
    updateUser: async (_, { id, ...data }, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
    
      try {
        const updatedUser = await prisma.user.update({
          where: { id },
          data,
        });
        return updatedUser;
      } catch (error) {
        console.error("Update failed:", error);
        throw new Error("Failed to update user");
      }
    },
    //delete user
    deleteUser: async (_, { id }, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
    
      try {
        await prisma.user.delete({
          where: { id },
        });
        return true;
      } catch (error) {
        console.error("Delete failed:", error);
        return false;
      }
    },
    createComplaint: async (_, args, { req , res }) => {
      if (!checkAuth(["student" , "driver" , "admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      const userId = fetchId(req.headers.cookie);
      return await prisma.complaint.create({
        data: {
          universityId : userId.toString(),
          Subject : args.Subject,
          Message : args.Message,
          createdAt : new Date()
        }
      });
    },
    deleteComplaint: async (_, { id }, { req , res }) => {
      if (!checkAuth(["admin"], fetchRole(req.headers.cookie))) {
        throw new Error("Unauthorized");
      }
      const complaint = await prisma.complaint.findUnique({
        where: {
          id : id
        }
      });
      if(complaint === null)
        throw new Error("Complaint not found");
      await prisma.complaint.delete({
        where: {
          id : id
        }
      });
      return complaint;
    },
      // Create a car (only ADMIN)
  createCar: async (_, args, { req , res }) => {
    if (!checkAuth(['admin'], fetchRole(req.headers.cookie))) {
      throw new Error('Unauthorized');
    }
    const cars = await prisma.car.deleteMany({
      where: {
        DriverId : args.DriverId
      }
    });
    const newCar = await prisma.car.create({
      data: args,
    });
    shareCarInfo(newCar);
    return newCar;
  },
  acceptRequest: async (_, { id }, { req , res }) => {
    if(!checkAuth(["admin"] , fetchRole(req.headers.cookie)))
      throw new Error("Unauthorized");
    else
    {
      const request = await prisma.request.findUnique({
        where: {
          id : id
        }
      });
      if(request === null)
        throw new Error("Request not found");
      if(request.status === "ACCEPTED" || request.status === "REJECTED")
        throw new Error("Request is already approved");
      const updatedRequest = await prisma.request.update({
        where: {
          id : id
        },
        data : {
          status : "ACCEPTED"
        }
      });

      const car = await prisma.car.create({
        data : {
          DriverId : updatedRequest.universityId,
          carModel : updatedRequest.carModel,
          carModelYear : updatedRequest.carModelYear,
          seats : updatedRequest.seats
        }
      });

      shareCarInfo(car);

      const user = await prisma.user.update({
        where: {
          universityId : updatedRequest.universityId
        },
        data : {
          role: "driver"
        }
      });
      return car;
    }
  },
  createRequest: async (_, args, { req , res }) => {
    if(!checkAuth(["student"] , fetchRole(req.headers.cookie)))
      throw new Error("Unauthorized");
    else
    {
              // Destructure file and other arguments
      const { file, ...restData } = args;

      const updateData = {
        ...restData,
        status: 'PENDING',
      };

      // If a file is uploaded, process and store the file URL
      if (file) {
        updateData.licenseURL = await saveUploadedFile(file);
      }

      // Create the request in the database
      return await prisma.request.create({
        data: updateData,
      });
    }
  },

  updateRequest: async (_, { id, ...data }, { req , res }) => {
    if (!checkAuth(['admin'], fetchRole(req.headers.cookie))) {
      throw new Error('Unauthorized');
    }
    try {
      return await prisma.request.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Update failed:', error);
      throw new Error('Failed to update request');
    }
  },

  deleteRequest: async (_, { id }, { req , res }) => {
    if (!checkAuth(['admin'], fetchRole(req.headers.cookie))) {
      throw new Error('Unauthorized');
    }
    try {
      await prisma.request.delete({ where: { id } });
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  },
  },
};


return {typeDefs , resolvers};
})();


export const userTypeDefs = typeDefs;
export const userResolvers = resolvers;
