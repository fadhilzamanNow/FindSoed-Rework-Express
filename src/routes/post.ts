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
    cb(null, 'src/public/images/'); 
    },
    filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); 
    },
});
    
const upload = multer({ storage: storage });

router.post("/create", verifyToken, upload.array("postImage",5) , async (req : Request, res : Response) => {
    const {itemName = null, itemDetail = null, itemCategory = null, itemStatus = null, itemLatitude = null, itemLongitude = null, locationName = null, itemLostDate = null, } = req.body
    console.log(itemName,itemCategory,itemDetail,itemLostDate,itemStatus)
    try{
        if(!itemName){
            throw new Error("Nama barang yang hilang masih kosong")
        }
        if(!itemDetail){
            throw new Error("Deskripsi barang yang hilang masih kosong")
        }
        if(!itemCategory){
            throw new Error("Kategori barang yang hilang masih kosong")
        }
        if(!itemLatitude){
            throw new Error("Latitude Barang masih kosong")
        }
        if(!itemLongitude){
            throw new Error("Longitude Barang masih kosong")
        }

        console.log("requirement completed")
        const statusId = await prisma.postStatus.findUnique({
            where : {
                statusName : "Hilang"
            }
        })
    
        const categoryId = await prisma.postCategory.findUnique({
            where : {
                categoryName : itemCategory
            }
        })
        let imageArray = []
        if(req.files && (req.files.length as number) > 0){
            console.log("Gambar berhasil diupload : ", req.files.length )
            imageArray = (req.files as Express.Multer.File[]).map((v,i) => {
                return {
                    postImageUrl : v.filename
                }
            })
        }else{
            throw new Error("Mohon Masukkan Gambar")
        }
        
        if(statusId && categoryId){
            console.log({
                itemName,
                itemDetail,
                //@ts-ignore
                userId : req.userId,
                categoryId : categoryId.id,
                statusId : statusId.id
            })
            const posts = await prisma.post.create({
                data : {
                    itemName : itemName,
                    itemDetail : itemDetail,
                    itemLostDate : new Date(itemLostDate),
                    //@ts-ignore
                    userId : req.userId,
                    categoryId : categoryId.id,
                    statusId : statusId.id,
                    image : {
                        create : imageArray
                    },
                    coordinate : {
                        create : {
                            locationName : locationName,
                            latitude : Number((itemLatitude as string)),
                            longitude : Number((itemLongitude as string))
                        }
                    }
                }
            })
            res.status(200).json({
                success : true,
                message : "Barang Hilang telah dibuat",
                data : {
                    id : posts.id,
                    name : posts.itemName
                }
            })
        }else{
            res.status(400).json({
                success : false,
                message : `${!statusId ? "Status" : ""}${(!statusId && !categoryId) ? " dan " : ""}${!categoryId ? "Kategori" : ""} tidak tersedia`
            })
        }
    }catch(err){
        console.log("error :", err)
        res.status(400).json({
            success : false,
            message : err
        })
    }
})

router.patch("/edit/:id", verifyToken, async (req : Request, res : Response) => {
    try{
    console.log("test : ", req.params.id)
    console.log(req.body)
    const {itemStatus = null, itemDetail = null, itemLostDate = null, itemCategory = null} = req.body
    const oldPost = await prisma.post.findUnique({
        where : {
            id : req.params.id
        }
    })
    let statusId : null | number = null;
    if(itemStatus){
        const findStatus = await prisma.postStatus.findFirst({
            where : {
                statusName : itemStatus
            }
        })
        if(findStatus){
            statusId = findStatus.id
        }else{
            console.log("find status tidak ditemukan")
        }
    }else{
        console.log("item status tidak ditemukan")
    }
    if(oldPost){
        console.log("testing  ")
            const newPost = await prisma.post.update({
                where : {
                    id : oldPost.id
                },
                data : {
                    updated_at : new Date(),
                    itemDetail : itemDetail ? itemDetail : oldPost.itemDetail ,
                    statusId : itemStatus ? statusId as number : oldPost.statusId, 
                    itemLostDate : itemLostDate ? new Date(itemLostDate) : oldPost.itemLostDate
                }
            })
            
            if(newPost){
                res.status(200).json({
                    success : true,
                    message : "Data berhasil untuk diperbarui",
                    data : newPost
                })
            }
       
    }else{
        console.log("old post tidak ditemukan")
    }
   res.status(200).json({
    success : true,
    message : "Data berhasil didapatkan"
   })
    }catch(e){
        console.log("e : ", e)
        res.status(400).json({
            success : false,
            message : "Data gagal untuk diubah"
        })
    }  
})

router.get("/", verifyToken, async (req : Request, res : Response) => {
    const posts = await prisma.post.findMany({
        select : {
            id : true,
            status : {
                select : {
                    statusName : true
                }
            },
            category : {
                select : {
                    categoryName : true
                }
            },
            created_at : true,
            updated_at : true,
            itemDetail : true,
            itemName : true,
            image :  {
                select : {
                    postImageUrl : true
                }
            },
            coordinate : true
        }
    });
   

    const formattedPosts = posts.map((v) => {
        return {
            id : v.id,
            itemName : v.itemName,
            itemDetail : v.itemDetail,
            statusName : v.status.statusName,
            categoryName : v.category.categoryName,
            images : v.image,
            created_at : v.created_at,
            updated_at : v.updated_at,
            coordinate : {
                latitude : v.coordinate?.latitude,
                longitude : v.coordinate?.longitude
            }

        }
    })
    res.status(200).json({
        success : true,
        data : formattedPosts
    })
})

router.delete("/:id", verifyToken, async (req : Request, res : Response) => {
    if(req.params.id){
        try{
           /*  const findPost = await prisma.postImages.findMany({
                where : {
                    postId : req.params.id
                }
            })
            const findCoordinates = await prisma.coordinates.findUnique({
                where : {
                    postId : req.params.id
                }
            })
            const Comments = await prisma.comments.findMany({
                where : {
                    postId : req.params.id
                }
            })

            if(findPost){
                findPost.forEach((v) => {
                    await prisma.post
                })
            } */

            const deleteImages = await prisma.postImages.deleteMany({
                where : {
                    postId : req.params.id
                }
            })

            const deleteComments = await prisma.comments.deleteMany({
                where : {
                    postId : req.params.id
                }
            })

            const deleteCoordinates = await prisma.coordinates.deleteMany({
                where : {
                    postId : req.params.id
                }
            })

            const deletePosts = await prisma.post.delete({
                where : {
                    id : req.params.id
                }
            })
           if(deletePosts){
                res.status(201).json({
                    success : false,
                    message : "Post berhasil dihapus",
                    data : {
                        detailPost : deletePosts,
                        ...(deleteComments ?? {comments : deleteComments}),
                        ...(deleteCoordinates ?? {coordinates : deleteCoordinates}),
                        ...(deleteImages ?? {comments : deleteComments})
                    }
                })
           }
        }catch(err){
            console.log("e : ", err)
            res.status(400).json({
                success : true,
                message : err
            })
        }
    }
})

router.get("/userpost", verifyToken, async (req : Request, res : Response) => {
    try{
        const findPost = await prisma.post.findMany({
            where : {
                //@ts-ignore
                userId : req.userId
            },
            select : {
                id : true,
                status : {
                    select : {
                        statusName : true
                    }
                },
                itemName : true
            }
        })
        if(findPost){
            const userPost = findPost.map((v) => {
                return {
                    postId : v.id,
                    status : v.status.statusName,
                    itemName : v.itemName
                }
            }).sort((a,b) => a.postId.localeCompare(b.postId) )

            res.status(200).json({
                success : true,
                message : "Data berhasil diperoleh",
                data : userPost
            })
        }
    }catch(e){
        res.status(400).json({
            success : false,
            message : e
        })
    }
})

router.get("/userpostdetail/:id", verifyToken, async (req : Request, res : Response) => {
    try{
        console.log(req.params.id)
        const findUserPostDetail = await prisma.post.findUnique({
            where :{
                id : req.params.id
            }
        })
        if(findUserPostDetail){
            console.log("post detail : ", findUserPostDetail)
            const findCategory = await prisma.postCategory.findUnique({
                where : {
                    id : findUserPostDetail.categoryId
                }
            })
            const findStatus = await prisma.postStatus.findUnique({
                where : {
                    id : findUserPostDetail.statusId
                }
            })

            if(findStatus && findCategory){
                console.log("isi status : ", findStatus)
                console.log("isi category : ", findCategory)
                res.status(200).json({
                    success : true,
                    message : "Data Post berhasil didapatkan",
                    data : {
                        id : findUserPostDetail.id,
                        itemName : findUserPostDetail.itemName,
                        itemLostDate : findUserPostDetail.itemLostDate,
                        itemDescription : findUserPostDetail.itemDetail,
                        itemCategory : findCategory.categoryName,
                        itemStatus : findStatus.statusName
                    }
                })
            }
        }
        /*if(findUserPostDetail){
            const findCategory = await prisma.postStatus.findUnique({
                where : {
                    id : findUserPostDetail.categoryId
                }
            })

            const findStatus = await prisma.postCategory.findUnique({
                where : {
                    id : findUserPostDetail.statusId
                }
            })
            if(findStatus && findCategory){
                res.status(200).json({
                    success : true,
                    message : "Data Post berhasil diperoleh",
                    data : {
                        id : findUserPostDetail.id,
                        itemName : findUserPostDetail.itemName,
                        itemLostDate : findUserPostDetail.itemLostDate,
                        itemDescription : findUserPostDetail.itemDetail,
                        itemCategory : findUserPostDetail.categoryId
                    }
                })
            }
        } */
       res.status(200).json({
            success : true,
            message : "Sukses mengambil data"
       })
    }catch(e){
        res.status(400).json({
            success : false,
            message : e
        })
    }
})



export {router as postRouter }

