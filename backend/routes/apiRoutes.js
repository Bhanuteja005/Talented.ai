const express = require("express");
const mongoose = require("mongoose");
const jwtAuth = require("../lib/jwtAuth");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");
const Job = require("../db/Job");
const Application = require("../db/Application");
const Rating = require("../db/Rating");

const router = express.Router();

// GridFS setup with error handling
let gfsBucket;
let gridFSReady = false;

mongoose.connection.once('open', () => {
  try {
    gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });
    gridFSReady = true;
    console.log('GridFS initialized successfully');
  } catch (error) {
    console.error('GridFS initialization failed:', error);
    gridFSReady = false;
  }
});

// Fallback file system directories
const resumeUploadDir = path.join(__dirname, "../uploads/resume");
const interviewUploadDir = path.join(__dirname, "../uploads/interviews");

if (!fs.existsSync(resumeUploadDir)) {
  fs.mkdirSync(resumeUploadDir, { recursive: true });
}
if (!fs.existsSync(interviewUploadDir)) {
  fs.mkdirSync(interviewUploadDir, { recursive: true });
}

// Helper function to upload file to GridFS with fallback
const uploadToGridFS = (buffer, filename, contentType, metadata = {}) => {
  return new Promise((resolve, reject) => {
    if (!gridFSReady || !gfsBucket) {
      reject(new Error('GridFS not available'));
      return;
    }

    const uploadStream = gfsBucket.openUploadStream(filename, {
      contentType: contentType,
      metadata: metadata
    });

    uploadStream.end(buffer);
    
    uploadStream.on('error', (error) => {
      console.error('GridFS upload error:', error);
      reject(error);
    });
    
    uploadStream.on('finish', () => {
      resolve({
        fileId: uploadStream.id,
        filename: filename
      });
    });
  });
};

// Helper function to save file to filesystem as fallback
const saveToFileSystem = (buffer, filename, directory) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(directory, filename);
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({ filename, filePath });
      }
    });
  });
};

// Multer configuration for memory storage
const memoryStorage = multer.memoryStorage();

const resumeUpload = multer({
  storage: memoryStorage,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    console.log('File filter - mimetype:', file.mimetype);
    console.log('File filter - originalname:', file.originalname);
    
    const allowedTypes = /\.(pdf|doc|docx|txt)$/i;
    const isValidExtension = allowedTypes.test(file.originalname);
    const isValidMime = file.mimetype.includes('pdf') || 
                       file.mimetype.includes('document') || 
                       file.mimetype.includes('text') ||
                       file.mimetype.includes('msword') ||
                       file.mimetype.includes('wordprocessingml') ||
                       file.mimetype === 'application/pdf' ||
                       file.mimetype === 'text/plain';
    
    if (isValidExtension || isValidMime) {
      cb(null, true);
    } else {
      cb(new Error('Only resume files (PDF, DOC, DOCX, TXT) are allowed'));
    }
  }
});

// Interview upload configuration
const interviewUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for video
  fileFilter: function (req, file, cb) {
    console.log('Interview file filter - mimetype:', file.mimetype);
    console.log('Interview file filter - originalname:', file.originalname);
    
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video/audio files are allowed'));
    }
  }
});

// Resume upload endpoint with GridFS and filesystem fallback
router.post("/uploads/resume", jwtAuth, resumeUpload.single('resume'), async (req, res) => {
  console.log("=== RESUME UPLOAD START ===");
  console.log("User:", req.user ? { id: req.user._id, type: req.user.type } : "No user");
  console.log("GridFS Ready:", gridFSReady);
  
  try {
    // Check user type first
    if (!req.user || req.user.type !== "applicant") {
      return res.status(403).json({
        success: false,
        message: "Only job applicants can upload resumes",
        error: "INVALID_USER_TYPE"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file received",
        error: "NO_FILE"
      });
    }

    console.log("File received:", req.file.originalname, "Size:", req.file.size);

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${req.user._id}_${uniqueSuffix}_${req.file.originalname}`;

    let uploadResult = null;
    let useGridFS = false;

    // Try GridFS first, fallback to filesystem
    try {
      if (gridFSReady) {
        uploadResult = await uploadToGridFS(
          req.file.buffer,
          filename,
          req.file.mimetype,
          {
            userId: req.user._id,
            originalName: req.file.originalname,
            fileType: 'resume',
            uploadDate: new Date()
          }
        );
        useGridFS = true;
        console.log("File uploaded to GridFS:", uploadResult.fileId);
      }
    } catch (gridError) {
      console.warn("GridFS upload failed, using filesystem:", gridError.message);
    }

    // Fallback to filesystem if GridFS failed
    if (!uploadResult) {
      uploadResult = await saveToFileSystem(req.file.buffer, filename, resumeUploadDir);
      console.log("File saved to filesystem:", uploadResult.filePath);
    }

    // Update JobApplicant record with both filename and fileId
    const updateData = { 
      resume: uploadResult.filename,
      resumeOriginalName: req.file.originalname // Store original name
    };
    if (useGridFS && uploadResult.fileId) {
      updateData.resumeFileId = uploadResult.fileId;
    }

    const updatedApplicant = await JobApplicant.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateData },
      { new: true }
    );

    if (!updatedApplicant) {
      // Cleanup uploaded file if database update fails
      if (useGridFS && uploadResult.fileId) {
        try {
          await gfsBucket.delete(uploadResult.fileId);
        } catch (e) { console.error('Cleanup error:', e); }
      } else if (uploadResult.filePath) {
        try {
          fs.unlinkSync(uploadResult.filePath);
        } catch (e) { console.error('Cleanup error:', e); }
      }
      
      return res.status(404).json({
        success: false,
        message: "Job applicant profile not found",
        error: "PROFILE_NOT_FOUND"
      });
    }

    console.log("=== UPLOAD SUCCESS ===");
    res.json({
      success: true,
      message: "Resume uploaded successfully",
      filename: uploadResult.filename,
      fileId: uploadResult.fileId || null,
      originalName: req.file.originalname,
      storageType: useGridFS ? 'gridfs' : 'filesystem'
    });

  } catch (error) {
    console.error("Resume upload error:", error);
    res.status(500).json({
      success: false,
      message: "Resume upload failed",
      error: error.message
    });
  }
});

// Resume download endpoint with GridFS and filesystem fallback
router.get("/download/resume/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;
    console.log("Download request for:", identifier);

    // First, try to find file by filename in GridFS
    if (gridFSReady) {
      try {
        const files = await gfsBucket.find({ filename: identifier }).toArray();
        
        if (files && files.length > 0) {
          const file = files[0];
          console.log("Downloading from GridFS by filename:", file.filename);
          
          res.set({
            'Content-Type': file.contentType,
            'Content-Disposition': `attachment; filename="${file.metadata?.originalName || file.filename}"`
          });

          const downloadStream = gfsBucket.openDownloadStream(file._id);
          downloadStream.pipe(res);

          downloadStream.on('error', (error) => {
            console.error("GridFS download error:", error);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                message: "Download failed",
                error: error.message
              });
            }
          });
          return;
        }
      } catch (gridError) {
        console.log("GridFS filename search failed:", gridError.message);
      }
    }

    // Try to find file by GridFS ID if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier) && gridFSReady) {
      try {
        const fileId = new mongoose.Types.ObjectId(identifier);
        const files = await gfsBucket.find({ _id: fileId }).toArray();
        
        if (files && files.length > 0) {
          const file = files[0];
          console.log("Downloading from GridFS by ID:", file.filename);
          
          res.set({
            'Content-Type': file.contentType,
            'Content-Disposition': `attachment; filename="${file.metadata?.originalName || file.filename}"`
          });

          const downloadStream = gfsBucket.openDownloadStream(fileId);
          downloadStream.pipe(res);

          downloadStream.on('error', (error) => {
            console.error("GridFS download error:", error);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                message: "Download failed",
                error: error.message
              });
            }
          });
          return;
        }
      } catch (gridError) {
        console.warn("GridFS ID download failed, trying filesystem:", gridError.message);
      }
    }

    // Fallback to filesystem
    const filePath = path.join(resumeUploadDir, identifier);
    
    if (fs.existsSync(filePath)) {
      console.log("Downloading from filesystem:", filePath);
      res.download(filePath, (err) => {
        if (err) {
          console.error("Filesystem download error:", err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: "Download failed",
              error: err.message
            });
          }
        }
      });
    } else {
      console.log("File not found in GridFS or filesystem");
      res.status(404).json({
        success: false,
        message: "File not found",
        error: "FILE_NOT_FOUND"
      });
    }

  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({
      success: false,
      message: "Download failed",
      error: error.message
    });
  }
});

// To add new job
router.post("/jobs", jwtAuth, (req, res) => {
  const user = req.user;

  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to add jobs",
    });
    return;
  }

  const data = req.body;

  let job = new Job({
    userId: user._id,
    title: data.title,
    maxApplicants: data.maxApplicants,
    maxPositions: data.maxPositions,
    dateOfPosting: data.dateOfPosting,
    deadline: data.deadline,
    skillsets: data.skillsets,
    jobType: data.jobType,
    duration: data.duration,
    salary: data.salary,
    rating: data.rating,
  });

  job
    .save()
    .then(() => {
      res.json({ message: "Job added successfully to the database" });
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

// to get all the jobs [pagination] [for recruiter personal and for everyone]
router.get("/jobs", jwtAuth, (req, res) => {
  let user = req.user;

  let findParams = {};
  let sortParams = {};

  // const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
  // const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
  // const skip = page - 1 >= 0 ? (page - 1) * limit : 0;

  // to list down jobs posted by a particular recruiter
  if (user.type === "recruiter" && req.query.myjobs) {
    findParams = {
      ...findParams,
      userId: user._id,
    };
  }

  if (req.query.q) {
    findParams = {
      ...findParams,
      title: {
        $regex: new RegExp(req.query.q, "i"),
      },
    };
  }

  if (req.query.jobType) {
    let jobTypes = [];
    if (Array.isArray(req.query.jobType)) {
      jobTypes = req.query.jobType;
    } else {
      jobTypes = [req.query.jobType];
    }
    console.log(jobTypes);
    findParams = {
      ...findParams,
      jobType: {
        $in: jobTypes,
      },
    };
  }

  if (req.query.salaryMin && req.query.salaryMax) {
    findParams = {
      ...findParams,
      $and: [
        {
          salary: {
            $gte: parseInt(req.query.salaryMin),
          },
        },
        {
          salary: {
            $lte: parseInt(req.query.salaryMax),
          },
        },
      ],
    };
  } else if (req.query.salaryMin) {
    findParams = {
      ...findParams,
      salary: {
        $gte: parseInt(req.query.salaryMin),
      },
    };
  } else if (req.query.salaryMax) {
    findParams = {
      ...findParams,
      salary: {
        $lte: parseInt(req.query.salaryMax),
      },
    };
  }

  if (req.query.duration) {
    findParams = {
      ...findParams,
      duration: {
        $lt: parseInt(req.query.duration),
      },
    };
  }

  if (req.query.asc) {
    if (Array.isArray(req.query.asc)) {
      req.query.asc.map((key) => {
        sortParams = {
          ...sortParams,
          [key]: 1,
        };
      });
    } else {
      sortParams = {
        ...sortParams,
        [req.query.asc]: 1,
      };
    }
  }

  if (req.query.desc) {
    if (Array.isArray(req.query.desc)) {
      req.query.desc.map((key) => {
        sortParams = {
          ...sortParams,
          [key]: -1,
        };
      });
    } else {
      sortParams = {
        ...sortParams,
        [req.query.desc]: -1,
      };
    }
  }

  console.log(findParams);
  console.log(sortParams);

  // Job.find(findParams).collation({ locale: "en" }).sort(sortParams);
  // .skip(skip)
  // .limit(limit)

  let arr = [
    {
      $lookup: {
        from: "recruiterinfos",
        localField: "userId",
        foreignField: "userId",
        as: "recruiter",
      },
    },
    { $unwind: "$recruiter" },
    { $match: findParams },
  ];

  if (Object.keys(sortParams).length > 0) {
    arr = [
      {
        $lookup: {
          from: "recruiterinfos",
          localField: "userId",
          foreignField: "userId",
          as: "recruiter",
        },
      },
      { $unwind: "$recruiter" },
      { $match: findParams },
      {
        $sort: sortParams,
      },
    ];
  }

  console.log(arr);

  Job.aggregate(arr)
    .then((posts) => {
      if (posts == null) {
        res.status(404).json({
          message: "No job found",
        });
        return;
      }
      res.json(posts);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

// to get info about a particular job
router.get("/jobs/:id", jwtAuth, (req, res) => {
  Job.findOne({ _id: req.params.id })
    .then((job) => {
      if (job == null) {
        res.status(400).json({
          message: "Job does not exist",
        });
        return;
      }
      res.json(job);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

// to update info of a particular job
router.put("/jobs/:id", jwtAuth, (req, res) => {
  const user = req.user;
  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to change the job details",
    });
    return;
  }
  Job.findOne({
    _id: req.params.id,
    userId: user.id,
  })
    .then((job) => {
      if (job == null) {
        res.status(404).json({
          message: "Job does not exist",
        });
        return;
      }
      const data = req.body;
      if (data.maxApplicants) {
        job.maxApplicants = data.maxApplicants;
      }
      if (data.maxPositions) {
        job.maxPositions = data.maxPositions;
      }
      if (data.deadline) {
        job.deadline = data.deadline;
      }
      job
        .save()
        .then(() => {
          res.json({
            message: "Job details updated successfully",
          });
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

// to delete a job
router.delete("/jobs/:id", jwtAuth, (req, res) => {
  const user = req.user;
  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to delete the job",
    });
    return;
  }
  Job.findOneAndDelete({
    _id: req.params.id,
    userId: user.id,
  })
    .then((job) => {
      if (job === null) {
        res.status(401).json({
          message: "You don't have permissions to delete the job",
        });
        return;
      }
      res.json({
        message: "Job deleted successfully",
      });
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

// get user's personal details
router.get("/user", jwtAuth, (req, res) => {
  const user = req.user;
  if (user.type === "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        res.json(recruiter);
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        res.json(jobApplicant);
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  }
});

// get user details from id
router.get("/user/:id", jwtAuth, (req, res) => {
  User.findOne({ _id: req.params.id })
    .then((userData) => {
      if (userData === null) {
        res.status(404).json({
          message: "User does not exist",
        });
        return;
      }

      if (userData.type === "recruiter") {
        Recruiter.findOne({ userId: userData._id })
          .then((recruiter) => {
            if (recruiter === null) {
              res.status(404).json({
                message: "User does not exist",
              });
              return;
            }
            res.json(recruiter);
          })
          .catch((err) => {
            res.status(400).json(err);
          });
      } else {
        JobApplicant.findOne({ userId: userData._id })
          .then((jobApplicant) => {
            if (jobApplicant === null) {
              res.status(404).json({
                message: "User does not exist",
              });
              return;
            }
            res.json(jobApplicant);
          })
          .catch((err) => {
            res.status(400).json(err);
          });
      }
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

// update user details
router.put("/user", jwtAuth, (req, res) => {
  const user = req.user;
  const data = req.body;
  if (user.type == "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        if (data.name) {
          recruiter.name = data.name;
        }
        if (data.contactNumber) {
          recruiter.contactNumber = data.contactNumber;
        }
        if (data.bio) {
          recruiter.bio = data.bio;
        }
        recruiter
          .save()
          .then(() => {
            res.json({
              message: "User information updated successfully",
            });
          })
          .catch((err) => {
            res.status(400).json(err);
          });
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        if (data.name) {
          jobApplicant.name = data.name;
        }
        if (data.education) {
          jobApplicant.education = data.education;
        }
        if (data.skills) {
          jobApplicant.skills = data.skills;
        }
        if (data.resume) {
          jobApplicant.resume = data.resume;
        }
        if (data.profile) {
          jobApplicant.profile = data.profile;
        }
        console.log(jobApplicant);
        jobApplicant
          .save()
          .then(() => {
            res.json({
              message: "User information updated successfully",
            });
          })
          .catch((err) => {
            res.status(400).json(err);
          });
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  }
});

// apply for a job [todo: test: done]
router.post("/jobs/:id/applications", jwtAuth, (req, res) => {
  const user = req.user;
  if (user.type != "applicant") {
    res.status(401).json({
      message: "You don't have permissions to apply for a job",
    });
    return;
  }
  const data = req.body;
  const jobId = req.params.id;

  // check whether applied previously
  // find job
  // check count of active applications < limit
  // check user had < 10 active applications && check if user is not having any accepted jobs (user id)
  // store the data in applications

  Application.findOne({
    userId: user._id,
    jobId: jobId,
    status: {
      $nin: ["deleted", "accepted", "cancelled"],
    },
  })
    .then((appliedApplication) => {
      console.log(appliedApplication);
      if (appliedApplication !== null) {
        res.status(400).json({
          message: "You have already applied for this job",
        });
        return;
      }

      Job.findOne({ _id: jobId })
        .then((job) => {
          if (job === null) {
            res.status(404).json({
              message: "Job does not exist",
            });
            return;
          }
          Application.countDocuments({
            jobId: jobId,
            status: {
              $nin: ["rejected", "deleted", "cancelled", "finished"],
            },
          })
            .then((activeApplicationCount) => {
              if (activeApplicationCount < job.maxApplicants) {
                Application.countDocuments({
                  userId: user._id,
                  status: {
                    $nin: ["rejected", "deleted", "cancelled", "finished"],
                  },
                })
                  .then((myActiveApplicationCount) => {
                    if (myActiveApplicationCount < 10) {
                      Application.countDocuments({
                        userId: user._id,
                        status: "accepted",
                      }).then((acceptedJobs) => {
                        if (acceptedJobs === 0) {
                          const application = new Application({
                            userId: user._id,
                            recruiterId: job.userId,
                            jobId: job._id,
                            status: "applied",
                            sop: data.sop,
                          });
                          application
                            .save()
                            .then(() => {
                              res.json({
                                message: "Job application successful",
                              });
                            })
                            .catch((err) => {
                              res.status(400).json(err);
                            });
                        } else {
                          res.status(400).json({
                            message:
                              "You already have an accepted job. Hence you cannot apply.",
                          });
                        }
                      });
                    } else {
                      res.status(400).json({
                        message:
                          "You have 10 active applications. Hence you cannot apply.",
                      });
                    }
                  })
                  .catch((err) => {
                    res.status(400).json(err);
                  });
              } else {
                res.status(400).json({
                  message: "Application limit reached",
                });
              }
            })
            .catch((err) => {
              res.status(400).json(err);
            });
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    })
    .catch((err) => {
      res.json(400).json(err);
    });
});

// recruiter gets applications for a particular job [pagination] [todo: test: done]
router.get("/jobs/:id/applications", jwtAuth, (req, res) => {
  const user = req.user;
  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to view job applications",
    });
    return;
  }
  const jobId = req.params.id;

  // const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
  // const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
  // const skip = page - 1 >= 0 ? (page - 1) * limit : 0;

  let findParams = {
    jobId: jobId,
    recruiterId: user._id,
  };

  let sortParams = {};

  if (req.query.status) {
    findParams = {
      ...findParams,
      status: req.query.status,
    };
  }

  Application.find(findParams)
    .collation({ locale: "en" })
    .sort(sortParams)
    // .skip(skip)
    // .limit(limit)
    .then((applications) => {
      res.json(applications);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

// recruiter/applicant gets all his applications [pagination]
router.get("/applications", jwtAuth, (req, res) => {
  const user = req.user;

  // const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
  // const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
  // const skip = page - 1 >= 0 ? (page - 1) * limit : 0;

  Application.aggregate([
    {
      $lookup: {
        from: "jobapplicantinfos",
        localField: "userId",
        foreignField: "userId",
        as: "jobApplicant",
      },
    },
    { $unwind: "$jobApplicant" },
    {
      $lookup: {
        from: "jobs",
        localField: "jobId",
        foreignField: "_id",
        as: "job",
      },
    },
    { $unwind: "$job" },
    {
      $lookup: {
        from: "recruiterinfos",
        localField: "recruiterId",
        foreignField: "userId",
        as: "recruiter",
      },
    },
    { $unwind: "$recruiter" },
    {
      $match: {
        [user.type === "recruiter" ? "recruiterId" : "userId"]: user._id,
      },
    },
    {
      $sort: {
        dateOfApplication: -1,
      },
    },
  ])
    .then((applications) => {
      res.json(applications);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

// update status of application: [Applicant: Can cancel, Recruiter: Can do everything] [todo: test: done]
router.put("/applications/:id", jwtAuth, (req, res) => {
  const user = req.user;
  const id = req.params.id;
  const status = req.body.status;

  // "applied", // when a applicant is applied
  // "shortlisted", // when a applicant is shortlisted
  // "accepted", // when a applicant is accepted
  // "rejected", // when a applicant is rejected
  // "deleted", // when any job is deleted
  // "cancelled", // an application is cancelled by its author or when other application is accepted
  // "finished", // when job is over

  if (user.type === "recruiter") {
    if (status === "accepted") {
      // get job id from application
      // get job info for maxPositions count
      // count applications that are already accepted
      // compare and if condition is satisfied, then save

      Application.findOne({
        _id: id,
        recruiterId: user._id,
      })
        .then((application) => {
          if (application === null) {
            res.status(404).json({
              message: "Application not found",
            });
            return;
          }

          Job.findOne({
            _id: application.jobId,
            userId: user._id,
          }).then((job) => {
            if (job === null) {
              res.status(404).json({
                message: "Job does not exist",
              });
              return;
            }

            Application.countDocuments({
              recruiterId: user._id,
              jobId: job._id,
              status: "accepted",
            }).then((activeApplicationCount) => {
              if (activeApplicationCount < job.maxPositions) {
                // accepted
                application.status = status;
                application.dateOfJoining = req.body.dateOfJoining;
                application
                  .save()
                  .then(() => {
                    Application.updateMany(
                      {
                        _id: {
                          $ne: application._id,
                        },
                        userId: application.userId,
                        status: {
                          $nin: [
                            "rejected",
                            "deleted",
                            "cancelled",
                            "accepted",
                            "finished",
                          ],
                        },
                      },
                      {
                        $set: {
                          status: "cancelled",
                        },
                      },
                      { multi: true }
                    )
                      .then(() => {
                        if (status === "accepted") {
                          Job.findOneAndUpdate(
                            {
                              _id: job._id,
                              userId: user._id,
                            },
                            {
                              $set: {
                                acceptedCandidates: activeApplicationCount + 1,
                              },
                            }
                          )
                            .then(() => {
                              res.json({
                                message: `Application ${status} successfully`,
                              });
                            })
                            .catch((err) => {
                              res.status(400).json(err);
                            });
                        } else {
                          res.json({
                            message: `Application ${status} successfully`,
                          });
                        }
                      })
                      .catch((err) => {
                        res.status(400).json(err);
                      });
                  })
                  .catch((err) => {
                    res.status(400).json(err);
                  });
              } else {
                res.status(400).json({
                  message: "All positions for this job are already filled",
                });
              }
            });
          });
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    } else {
      Application.findOneAndUpdate(
        {
          _id: id,
          recruiterId: user._id,
          status: {
            $nin: ["rejected", "deleted", "cancelled"],
          },
        },
        {
          $set: {
            status: status,
          },
        }
      )
        .then((application) => {
          if (application === null) {
            res.status(400).json({
              message: "Application status cannot be updated",
            });
            return;
          }
          if (status === "finished") {
            res.json({
              message: `Job ${status} successfully`,
            });
          } else {
            res.json({
              message: `Application ${status} successfully`,
            });
          }
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    }
  } else {
    if (status === "cancelled") {
      console.log(id);
      console.log(user._id);
      Application.findOneAndUpdate(
        {
          _id: id,
          userId: user._id,
        },
        {
          $set: {
            status: status,
          },
        }
      )
        .then((tmp) => {
          console.log(tmp);
          res.json({
            message: `Application ${status} successfully`,
          });
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    } else {
      res.status(401).json({
        message: "You don't have permissions to update job status",
      });
    }
  }
});

// get a list of final applicants for current job : recruiter
// get a list of final applicants for all his jobs : recuiter
router.get("/applicants", jwtAuth, (req, res) => {
  const user = req.user;
  if (user.type === "recruiter") {
    let findParams = {
      recruiterId: user._id,
    };
    if (req.query.jobId) {
      findParams = {
        ...findParams,
        jobId: new mongoose.Types.ObjectId(req.query.jobId),
      };
    }
    if (req.query.status) {
      if (Array.isArray(req.query.status)) {
        findParams = {
          ...findParams,
          status: { $in: req.query.status },
        };
      } else {
        findParams = {
          ...findParams,
          status: req.query.status,
        };
      }
    }
    let sortParams = {};

    if (!req.query.asc && !req.query.desc) {
      sortParams = { _id: 1 };
    }

    if (req.query.asc) {
      if (Array.isArray(req.query.asc)) {
        req.query.asc.map((key) => {
          sortParams = {
            ...sortParams,
            [key]: 1,
          };
        });
      } else {
        sortParams = {
          ...sortParams,
          [req.query.asc]: 1,
        };
      }
    }

    if (req.query.desc) {
      if (Array.isArray(req.query.desc)) {
        req.query.desc.map((key) => {
          sortParams = {
            ...sortParams,
            [key]: -1,
          };
        });
      } else {
        sortParams = {
          ...sortParams,
          [req.query.desc]: -1,
        };
      }
    }

    Application.aggregate([
      {
        $lookup: {
          from: "jobapplicantinfos",
          localField: "userId",
          foreignField: "userId",
          as: "jobApplicant",
        },
      },
      { $unwind: "$jobApplicant" },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: "$job" },
      { $match: findParams },
      { $sort: sortParams },
    ])
      .then((applications) => {
        if (applications.length === 0) {
          res.status(404).json({
            message: "No applicants found",
          });
          return;
        }
        res.json(applications);
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  } else {
    res.status(400).json({
      message: "You are not allowed to access applicants list",
    });
  }
});

// to add or update a rating [todo: test]
router.put("/rating", jwtAuth, (req, res) => {
  const user = req.user;
  const data = req.body;
  if (user.type === "recruiter") {
    // can rate applicant
    Rating.findOne({
      senderId: user._id,
      receiverId: data.applicantId,
      category: "applicant",
    })
      .then((rating) => {
        if (rating === null) {
          console.log("new rating");
          Application.countDocuments({
            userId: data.applicantId,
            recruiterId: user._id,
            status: {
              $in: ["accepted", "finished"],
            },
          })
            .then((acceptedApplicant) => {
              if (acceptedApplicant > 0) {
                // add a new rating

                rating = new Rating({
                  category: "applicant",
                  receiverId: data.applicantId,
                  senderId: user._id,
                  rating: data.rating,
                });

                rating
                  .save()
                  .then(() => {
                    // get the average of ratings
                    Rating.aggregate([
                      {
                        $match: {
                          receiverId: mongoose.Types.ObjectId(data.applicantId),
                          category: "applicant",
                        },
                      },
                      {
                        $group: {
                          _id: {},
                          average: { $avg: "$rating" },
                        },
                      },
                    ])
                      .then((result) => {
                        // update the user's rating
                        if (result === null) {
                          res.status(400).json({
                            message: "Error while calculating rating",
                          });
                          return;
                        }
                        const avg = result[0].average;

                        JobApplicant.findOneAndUpdate(
                          {
                            userId: data.applicantId,
                          },
                          {
                            $set: {
                              rating: avg,
                            },
                          }
                        )
                          .then((applicant) => {
                            if (applicant === null) {
                              res.status(400).json({
                                message:
                                  "Error while updating applicant's average rating",
                              });
                              return;
                            }
                            res.json({
                              message: "Rating added successfully",
                            });
                          })
                          .catch((err) => {
                            res.status(400).json(err);
                          });
                      })
                      .catch((err) => {
                        res.status(400).json(err);
                      });
                  })
                  .catch((err) => {
                    res.status(400).json(err);
                  });
              } else {
                // you cannot rate
                res.status(400).json({
                  message:
                    "Applicant didn't worked under you. Hence you cannot give a rating.",
                });
              }
            })
            .catch((err) => {
              res.status(400).json(err);
            });
        } else {
          rating.rating = data.rating;
          rating
            .save()
            .then(() => {
              // get the average of ratings
              Rating.aggregate([
                {
                  $match: {
                    receiverId: mongoose.Types.ObjectId(data.applicantId),
                    category: "applicant",
                  },
                },
                {
                  $group: {
                    _id: {},
                    average: { $avg: "$rating" },
                  },
                },
              ])
                .then((result) => {
                  // update the user's rating
                  if (result === null) {
                    res.status(400).json({
                      message: "Error while calculating rating",
                    });
                    return;
                  }
                  const avg = result[0].average;
                  JobApplicant.findOneAndUpdate(
                    {
                      userId: data.applicantId,
                    },
                    {
                      $set: {
                        rating: avg,
                      },
                    }
                  )
                    .then((applicant) => {
                      if (applicant === null) {
                        res.status(400).json({
                          message:
                            "Error while updating applicant's average rating",
                        });
                        return;
                      }
                      res.json({
                        message: "Rating updated successfully",
                      });
                    })
                    .catch((err) => {
                      res.status(400).json(err);
                    });
                })
                .catch((err) => {
                  res.status(400).json(err);
                });
            })
            .catch((err) => {
              res.status(400).json(err);
            });
        }
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  } else {
    // applicant can rate job
    Rating.findOne({
      senderId: user._id,
      receiverId: data.jobId,
      category: "job",
    })
      .then((rating) => {
        console.log(user._id);
        console.log(data.jobId);
        console.log(rating);
        if (rating === null) {
          console.log(rating);
          Application.countDocuments({
            userId: user._id,
            jobId: data.jobId,
            status: {
              $in: ["accepted", "finished"],
            },
          })
            .then((acceptedApplicant) => {
              if (acceptedApplicant > 0) {
                // add a new rating

                rating = new Rating({
                  category: "job",
                  receiverId: data.jobId,
                  senderId: user._id,
                  rating: data.rating,
                });

                rating
                  .save()
                  .then(() => {
                    // get the average of ratings
                    Rating.aggregate([
                      {
                        $match: {
                          receiverId: mongoose.Types.ObjectId(data.jobId),
                          category: "job",
                        },
                      },
                      {
                        $group: {
                          _id: {},
                          average: { $avg: "$rating" },
                        },
                      },
                    ])
                      .then((result) => {
                        if (result === null) {
                          res.status(400).json({
                            message: "Error while calculating rating",
                          });
                          return;
                        }
                        const avg = result[0].average;
                        Job.findOneAndUpdate(
                          {
                            _id: data.jobId,
                          },
                          {
                            $set: {
                              rating: avg,
                            },
                          }
                        )
                          .then((foundJob) => {
                            if (foundJob === null) {
                              res.status(400).json({
                                message:
                                  "Error while updating job's average rating",
                              });
                              return;
                            }
                            res.json({
                              message: "Rating added successfully",
                            });
                          })
                          .catch((err) => {
                            res.status(400).json(err);
                          });
                      })
                      .catch((err) => {
                        res.status(400).json(err);
                      });
                  })
                  .catch((err) => {
                    res.status(400).json(err);
                  });
              } else {
                // you cannot rate
                res.status(400).json({
                  message:
                    "You haven't worked for this job. Hence you cannot give a rating.",
                });
              }
            })
            .catch((err) => {
              res.status(400).json(err);
            });
        } else {
          // update the rating
          rating.rating = data.rating;
          rating
            .save()
            .then(() => {
              // get the average of ratings
              Rating.aggregate([
                {
                  $match: {
                    receiverId: mongoose.Types.ObjectId(data.jobId),
                    category: "job",
                  },
                },
                {
                  $group: {
                    _id: {},
                    average: { $avg: "$rating" },
                  },
                },
              ])
                .then((result) => {
                  if (result === null) {
                    res.status(400).json({
                      message: "Error while calculating rating",
                    });
                    return;
                  }
                  const avg = result[0].average;
                  console.log(avg);

                  Job.findOneAndUpdate(
                    {
                      _id: data.jobId,
                    },
                    {
                      $set: {
                        rating: avg,
                      },
                    }
                  )
                    .then((foundJob) => {
                      if (foundJob === null) {
                        res.status(400).json({
                          message: "Error while updating job's average rating",
                        });
                        return;
                      }
                      res.json({
                        message: "Rating added successfully",
                      });
                    })
                    .catch((err) => {
                      res.status(400).json(err);
                    });
                })
                .catch((err) => {
                  res.status(400).json(err);
                });
            })
            .catch((err) => {
              res.status(400).json(err);
            });
        }
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  }
});

// get personal rating
router.get("/rating", jwtAuth, (req, res) => {
  const user = req.user;
  Rating.findOne({
    senderId: user._id,
    receiverId: req.query.id,
    category: user.type === "recruiter" ? "applicant" : "job",
  }).then((rating) => {
    if (rating === null) {
      res.json({
        rating: -1,
      });
      return;
    }
    res.json({
      rating: rating.rating,
    });
  });
});
// Updated interview results endpoint - STORE VIDEO IN MONGODB
router.post("/interview-results", jwtAuth, interviewUpload.single("video"), async (req, res) => {
  console.log("=== INTERVIEW RESULTS UPLOAD START ===");
  console.log("Body data:", {
    jobId: req.body.jobId,
    applicationId: req.body.applicationId,
    hasVideo: !!req.file
  });
  
  try {
    const { jobId, applicationId, questions, answers, scores, overallScore } = req.body;
    const user = req.user;
    let videoFileId = null;
    let videoFilename = null;
    let useGridFS = false;

    // Validate required fields
    if (!jobId || !applicationId) {
      return res.status(400).json({
        message: "Missing required fields: jobId and applicationId",
        success: false
      });
    }

    // Upload video to GridFS if provided
    if (req.file) {
      console.log("Video file received:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `${applicationId}_interview_${uniqueSuffix}.webm`;

      // Try GridFS first, fallback to filesystem
      try {
        if (gridFSReady) {
          const uploadResult = await uploadToGridFS(
            req.file.buffer,
            filename,
            req.file.mimetype,
            {
              userId: user._id,
              applicationId: applicationId,
              jobId: jobId,
              originalName: req.file.originalname,
              fileType: 'interview_video',
              uploadDate: new Date()
            }
          );
          videoFileId = uploadResult.fileId;
          videoFilename = uploadResult.filename;
          useGridFS = true;
          console.log("Video uploaded to GridFS:", videoFileId);
        }
      } catch (gridError) {
        console.warn("GridFS video upload failed, using filesystem:", gridError.message);
      }

      // Fallback to filesystem if GridFS failed
      if (!videoFileId) {
        const uploadResult = await saveToFileSystem(req.file.buffer, filename, interviewUploadDir);
        videoFilename = uploadResult.filename;
        console.log("Video saved to filesystem:", uploadResult.filePath);
      }
    } else {
      console.log("No video file provided");
    }

    // Save interview results to database
    const InterviewResult = require("../db/InterviewResult");
    const result = new InterviewResult({
      applicationId,
      jobId,
      userId: user._id,
      questions: Array.isArray(questions) ? questions : (questions ? [questions] : []),
      answers: Array.isArray(answers) ? answers : (answers ? [answers] : []),
      scores: Array.isArray(scores) ? scores.map(Number) : (scores ? [Number(scores)] : []),
      overallScore: Number(overallScore) || 0,
      videoRecording: videoFilename,
      videoFileId: videoFileId,
      completedAt: new Date()
    });

    await result.save();
    console.log("Interview results saved to database");

    // Update application status
    await Application.findByIdAndUpdate(
      applicationId,
      { 
        $set: { 
          interviewCompleted: true, 
          interviewScore: Number(overallScore) || 0 
        } 
      }
    );

    console.log("=== INTERVIEW RESULTS UPLOAD SUCCESS ===");
    res.json({
      message: "Interview results saved successfully",
      success: true,
      overallScore: Number(overallScore) || 0,
      videoFileId: videoFileId,
      storageType: useGridFS ? 'gridfs' : 'filesystem',
      hasVideo: !!videoFilename
    });

  } catch (error) {
    console.error("Interview results save error:", error);
    res.status(400).json({
      message: "Error saving interview results: " + error.message,
      success: false,
      error: error.message
    });
  }
});

// Download interview video endpoint
router.get("/download/interview/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;
    console.log("Video download request for:", identifier);

    // First, try to find file by filename in GridFS
    if (gridFSReady) {
      try {
        const files = await gfsBucket.find({ filename: identifier }).toArray();
        
        if (files && files.length > 0) {
          const file = files[0];
          console.log("Downloading video from GridFS by filename:", file.filename);
          
          res.set({
            'Content-Type': file.contentType,
            'Content-Length': file.length,
            'Accept-Ranges': 'bytes'
          });

          const downloadStream = gfsBucket.openDownloadStream(file._id);
          downloadStream.pipe(res);

          downloadStream.on('error', (error) => {
            console.error("GridFS video download error:", error);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                message: "Video download failed",
                error: error.message
              });
            }
          });
          return;
        }
      } catch (gridError) {
        console.log("GridFS filename search failed:", gridError.message);
      }
    }

    // Try to find file by GridFS ID if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier) && gridFSReady) {
      try {
        const fileId = new mongoose.Types.ObjectId(identifier);
        const files = await gfsBucket.find({ _id: fileId }).toArray();
        
        if (files && files.length > 0) {
          const file = files[0];
          console.log("Downloading video from GridFS by ID:", file.filename);
          
          res.set({
            'Content-Type': file.contentType,
            'Content-Length': file.length,
            'Accept-Ranges': 'bytes'
          });

          const downloadStream = gfsBucket.openDownloadStream(fileId);
          downloadStream.pipe(res);

          downloadStream.on('error', (error) => {
            console.error("GridFS video download error:", error);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                message: "Video download failed",
                error: error.message
              });
            }
          });
          return;
        }
      } catch (gridError) {
        console.warn("GridFS video download failed, trying filesystem:", gridError.message);
      }
    }

    // Fallback to filesystem
    const filePath = path.join(interviewUploadDir, identifier);
    
    if (fs.existsSync(filePath)) {
      console.log("Downloading video from filesystem:", filePath);
      res.download(filePath, (err) => {
        if (err) {
          console.error("Filesystem video download error:", err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: "Video download failed",
              error: err.message
            });
          }
        }
      });
    } else {
      console.log("Video file not found in either GridFS or filesystem");
      res.status(404).json({
        success: false,
        message: "Video file not found",
        error: "FILE_NOT_FOUND"
      });
    }

  } catch (error) {
    console.error("Video download error:", error);
    res.status(500).json({
      success: false,
      message: "Video download failed",
      error: error.message
    });
  }
});

// Stream interview video (for inline video playback)
router.get("/stream/interview/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;
    console.log("Video stream request for:", identifier);

    // Try GridFS first
    if (gridFSReady) {
      try {
        let file = null;
        let downloadStream = null;

        // Try by filename first
        const filesByName = await gfsBucket.find({ filename: identifier }).toArray();
        if (filesByName && filesByName.length > 0) {
          file = filesByName[0];
          downloadStream = gfsBucket.openDownloadStream(file._id);
        }
        // Try by ObjectId if no filename match
        else if (mongoose.Types.ObjectId.isValid(identifier)) {
          const fileId = new mongoose.Types.ObjectId(identifier);
          const filesById = await gfsBucket.find({ _id: fileId }).toArray();
          if (filesById && filesById.length > 0) {
            file = filesById[0];
            downloadStream = gfsBucket.openDownloadStream(fileId);
          }
        }

        if (file && downloadStream) {
          console.log("Streaming video from GridFS:", file.filename);

          res.set({
            'Content-Type': file.contentType || 'video/webm',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache'
          });

          downloadStream.pipe(res);

          downloadStream.on('error', (error) => {
            console.error("GridFS video stream error:", error);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                message: "Video stream failed",
                error: error.message
              });
            }
          });
          return;
        }
      } catch (gridError) {
        console.warn("GridFS video stream failed:", gridError.message);
      }
    }

    // Fallback to filesystem
    const filePath = path.join(interviewUploadDir, identifier);

    if (fs.existsSync(filePath)) {
      console.log("Streaming video from filesystem:", filePath);
      res.set({
        'Content-Type': 'video/webm',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache'
      });

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);

      readStream.on('error', (error) => {
        console.error("Filesystem video stream error:", error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Video stream failed",
            error: error.message
          });
        }
      });
    } else {
      console.log("Video file not found for streaming");
      res.status(404).json({
        success: false,
        message: "Video file not found",
        error: "FILE_NOT_FOUND"
      });
    }

  } catch (error) {
    console.error("Video stream error:", error);
    res.status(500).json({
      success: false,
      message: "Video stream failed",
      error: error.message
    });
  }
});

// Add a dedicated endpoint to mark an interview as complete
router.put("/applications/:id/interview-complete", jwtAuth, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { interviewCompleted, interviewScore } = req.body;
    
    const updatedApplication = await Application.findByIdAndUpdate(
      applicationId,
      { 
        $set: { 
          interviewCompleted: interviewCompleted, 
          interviewScore: interviewScore 
        } 
      },
      { new: true }
    );
    
    if (!updatedApplication) {
      return res.status(404).json({
        message: "Application not found",
        success: false
      });
    }
    
    res.json({
      message: "Application updated successfully",
      success: true,
      application: updatedApplication
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: "Error updating application",
      success: false
    });
  }
});

// Endpoint to get interview results for an application
router.get("/applications/:id/interview-results", jwtAuth, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const InterviewResult = require("../db/InterviewResult");
    const result = await InterviewResult.findOne({ applicationId });
    if (!result) {
      return res.status(404).json({
        message: "Interview results not found",
        success: false
      });
    }
    res.json({
      success: true,
      result
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: "Error fetching interview results",
      success: false
    });
  }
});

// Get interview results for a specific application
router.get("/interview-results/:applicationId", jwtAuth, async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    const InterviewResult = require("../db/InterviewResult");
    
    const result = await InterviewResult.findOne({ applicationId: applicationId })
      .populate('applicationId')
      .populate('jobId')
      .populate('userId');
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Interview results not found"
      });
    }
    
    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error("Error fetching interview results:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching interview results",
      error: error.message
    });
  }
});

// Get all interview results for a recruiter's jobs
router.get("/interview-results", jwtAuth, async (req, res) => {
  try {
    const user = req.user;
    const InterviewResult = require("../db/InterviewResult");
    
    let findParams = {};
    
    if (user.type === "recruiter") {
      // Find all jobs posted by this recruiter
      const recruiterJobs = await Job.find({ userId: user._id }).select('_id');
      const jobIds = recruiterJobs.map(job => job._id);
      findParams.jobId = { $in: jobIds };
    } else if (user.type === "applicant") {
      // Find interview results for this applicant
      findParams.userId = user._id;
    }
    
    const results = await InterviewResult.find(findParams)
      .populate({
        path: 'applicationId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .populate('jobId')
      .populate('userId')
      .sort({ completedAt: -1 });
    
    res.json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error("Error fetching interview results:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching interview results",
      error: error.message
    });
  }
});

module.exports = router;