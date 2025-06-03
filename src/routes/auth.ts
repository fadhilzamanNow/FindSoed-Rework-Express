import express, { NextFunction, Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { verify } from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
const router = express.Router();
const prisma = new PrismaClient();

router.use(express.json());

type CustomError = {
  status: number;
  message: string;
};

type CustomRequest = Request & { userId: string };

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      //@ts-ignore
      req.userId = decoded.userId;
      next();
    }
  } catch (err) {
    res.status(401).json({
      success: false,
      message: err,
    });
  }
};

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, "src/public/images/");
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage: storage });

router.get("/", (req: Request, res: Response) => {
  res.send("ENTERING AUTH");
});

router.post("/register", async (req: Request, res: Response) => {
  try {
    const {
      username = null,
      email = null,
      password = null,
      phoneNumber = null,
    } = req.body;

    if (!username) {
      throw {
        status: 400,
        message: "Username tidak disediakan. Masukkan Username",
      };
    }

    if (!email) {
      throw { status: 400, message: "Email tidak disediakan. Masukkan Email" };
    }
    if (!password) {
      throw {
        status: 400,
        message: "Password tidak disediakan. Masukkan Password",
      };
    }

    const findEmail = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (findEmail) {
      throw {
        status: 400,
        message:
          "Email yang dimasukkan sudah pernah digunakan, gunakan email lain",
      };
    } else {
      const createUser = await prisma.user.create({
        data: {
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
          ...(phoneNumber && { phoneNumber: phoneNumber }),
        },
      });
      res.status(201).json({
        success: true,
        message: "Akunmu berhasil terdaftar di FindSoed",
        data: {
          id: createUser.id,
          username: createUser.username,
          email: createUser.email,
        },
      });
    }
  } catch (e) {
    res.status((e as CustomError).status).json({
      success: false,
      message: (e as CustomError).message,
    });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email = null, password = null } = req.body;
    if (!email) {
      throw { status: 400, message: "Email belum dimasukkan" };
    }

    if (!password) {
      throw { status: 400, message: "Password belum dimasukkan" };
    }

    const findEmail = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (findEmail) {
      if (findEmail.password === password) {
        const findProfile = await prisma.profile.findUnique({
          where: {
            userId: findEmail.id,
          },
        });
        const token = jwt.sign(
          { userId: findEmail.id },
          process.env.JWT_SECRET as string,
          { expiresIn: "1h" },
        );
        res.status(200).json({
          success: true,
          message: "Login Berhasil",
          data: {
            token: token,
            userId: findEmail.id,
            username: findEmail.username,
            email: findEmail.email,
            phoneNumber: findEmail.phoneNumber ? findEmail.phoneNumber : null,
            imageUrl: findProfile ? findProfile.imageUrl : null,
          },
        });
      } else {
        throw { status: 401, message: "Password yang kamu masukkan salah" };
      }
    } else {
      throw { status: 404, message: "Email yang kamu masukkan tidak tersedia" };
    }
  } catch (e) {
    console.log("isi e : ", e);
    res.status((e as CustomError).status).json({
      success: false,
      message: (e as CustomError).message,
    });
  }
});

router.get("/find", verifyToken, async (req: Request, res: Response) => {
  try {
    //@ts-ignore
    console.log("id here: ", req.userId);
    const findUser = await prisma.user.findUnique({
      where: {
        //@ts-ignore
        id: req.userId,
      },
    });

    if (findUser) {
      const findProfile = await prisma.profile.findUnique({
        where: {
          userId: findUser.id,
        },
      });

      res.status(200).json({
        success: true,
        message: "Berhasil mendapat informasi pengguna",
        data: {
          userId: findUser?.id,
          username: findUser?.username,
          email: findUser?.email,
          phoneNumber: findUser?.phoneNumber,
          imageUrl: findProfile?.imageUrl ? findProfile?.imageUrl : null,
        },
      });
    }
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err,
    });
  }
});

router.patch(
  "/editprofile",
  verifyToken,
  upload.single("profilePhoto"),
  async (req: Request, res: Response) => {
    try {
      const findUser = await prisma.user.findUnique({
        where: {
          //@ts-ignore
          id: req.userId,
        },
      });
      //@ts-ignore
      console.log("isi userId", req.userId);

      const findProfile = await prisma.profile.findUnique({
        where: {
          //@ts-ignore
          userId: req.userId,
        },
      });

      if (!findProfile) {
        const newProfile = await prisma.profile.create({
          data: {
            imageUrl: req.file?.filename,
            //@ts-ignore
            userId: req.userId,
          },
        });
        res.status(201).json({
          success: true,
          message: "Foto Profile telah berhasil untuk dirubah",
          data: {
            userId: findUser?.id,
            username: findUser?.username,
            email: findUser?.email,
            phoneNumber: findUser?.phoneNumber,
            imageUrl: newProfile.imageUrl,
          },
        });
      } else {
        if (
          existsSync(
            path.join(__dirname, `../public/images/${findProfile.imageUrl}`),
          )
        ) {
          fs.unlink(
            path.join(__dirname, `../public/images/${findProfile.imageUrl}`),
          );
        }
        const updateProfile = await prisma.profile.update({
          where: {
            //@ts-ignore
            userId: req.userId,
          },
          data: {
            imageUrl: req.file?.filename,
          },
        });
        res.status(201).json({
          success: true,
          message: "Foto Profile telah berhasil untuk dirubah",
          data: {
            userId: findUser?.id,
            username: findUser?.username,
            email: findUser?.email,
            phoneNumber: findUser?.phoneNumber,
            imageUrl: updateProfile.imageUrl,
          },
        });
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({
        success: false,
        message: e,
      });
    }
  },
);

router.patch("/editdata", verifyToken, async (req: Request, res: Response) => {
  try {
    const { userPassword = null, userPhoneNumber = null } = req.body;
    console.log(userPhoneNumber);
    const findUser = await prisma.user.findUnique({
      where: {
        //@ts-ignore
        id: req.userId,
      },
    });
    if (findUser) {
      const newUser = await prisma.user.update({
        where: {
          id: findUser.id,
        },
        data: {
          password: userPassword ? userPassword : findUser.password,
          phoneNumber: userPhoneNumber ? userPhoneNumber : findUser.phoneNumber,
        },
      });

      if (newUser) {
        const findProfile = await prisma.profile.findUnique({
          where: {
            userId: findUser.id,
          },
        });
        if (findProfile) {
          res.status(200).json({
            success: true,
            message: "Data berhasil diubah",
            data: {
              userId: newUser.id,
              username: newUser.username,
              email: newUser.email,
              phoneNumber: newUser.phoneNumber,
              imageUrl: findProfile.imageUrl,
            },
          });
        }
      }
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      message: e,
    });
  }
});

export { router as authRouter };
