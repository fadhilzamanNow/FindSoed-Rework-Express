import express, {NextFunction, Request, Response} from "express";
import jwt, { JwtPayload } from "jsonwebtoken"
import "dotenv/config"
import { PrismaClient } from "../../generated/prisma";
import multer from "multer";
import path from "path";

const router = express.Router();
const prisma = new PrismaClient()
router.use(express.json())
const verifyToken = (req : Request, res : Response, next : NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1] 
    try{
        if(token){
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) 
            console.log("hasil decoded : ", decoded);
            //@ts-ignore
            req.userId = decoded.userId
            next()
    }
    }catch(err){
        res.status(401).json({
            success : false,
            message : err
        })
    }   
    }

const storage = multer.diskStorage({
    destination: (_, __, cb) => {
    cb(null, 'uploads/'); 
    },
    filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); 
    },
});
    
const upload = multer({ storage: storage });

router.post("/create", verifyToken, upload.array("postImage",5) , async (req : Request, res : Response) => {
    const {itemName = null, itemDetail = null, imagePost = null, itemCategory = null, itemStatus = null} = req.body
    try{
        const statusId = await prisma.postStatus.findUnique({
            where : {
                statusName : itemStatus
            }
        })
    
        const categoryId = await prisma.postCategory.findUnique({
            where : {
                categoryName : itemCategory
            }
        })
        console.log("status : ", statusId, " category : ", categoryId)
        if(statusId && categoryId){
            const posts = await prisma.post.create({
                data : {
                    itemName : itemName,
                    itemDetail : itemDetail,
                    //@ts-ignore
                    userId : req.userId,
                    categoryId : categoryId.id,
                    statusId : statusId.id
                }
            })
            res.status(200).json({
                success : true,
                message : "Barang Hilang telah dibuat"
            })
        }else{
            res.status(400).json({
                success : false,
                message : `${!statusId ? "Status" : ""}${(!statusId && !categoryId) ? " dan " : ""}${!categoryId ? "Kategori" : ""} tidak tersedia`
            })
        }

    }catch(err){
        console.log("error")
        res.status(400).json({
            success : false,
            message : err
        })
    }
    
  
    

})

router.patch("/edit", verifyToken, async (req : Request, res : Response) => {
    
})

router.get("/", verifyToken, async (req : Request, res : Response) => {
    const posts = await prisma.post.findMany();
    res.status(200).json({
        success : true,
        data : posts
    })
})

export {router as postRouter }

