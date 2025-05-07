import express ,{ Request, Response } from "express";
import path from "path";
import bcrypt from "bcryptjs"
import multer from "multer";
import { authRouter } from "./routes/auth";
import { postRouter } from "./routes/post";
import { commentRouter } from "./routes/comment";
const app = express();
const port = 3500;


/* const prisma = new PrismaClient()
 */
app.use(express.json())
app.use(express.urlencoded({extended : true}))

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

app.get("/", (req : Request, res : Response) => {
    res.send("Hello Geyss")
})

app.listen(port, () => {
    console.log("Oke dah kelar")
})
app.use("/auth", authRouter)
app.use("/post", postRouter)
app.use("/comment", commentRouter)

app.use("/static",express.static(path.join(__dirname,"public")));

app.post('/upload', upload.array('images',5), async (req: Request, res: Response) => {
    console.log("ok")    
    console.log(req.files)
    const {itemName = null} = req.body
    const filesArray = (req.files as Express.Multer.File[]).map((v, i) => {
        return {
            id : i,
            filename : v.filename
        }
    } )
    
    if(req.files){
        res.status(201).json({
            success : true,
            message : "Gambar berhasil untuk dikirim",
            data : {
                itemName : itemName,
                files : filesArray
            }
        })
    }else{
        res.status(400).json({
            success : false,
            message : "Gambar gagal untuk dikirim"
        })
    }
  });


/* app.post('/upload', upload.single('image'), (req : Request, res : Response) => {
        if (!req.file) {
          return res.status(400).send('No file uploaded.');
        }
        res.status(200).send('File uploaded successfully.');
      }); */

app.get("/test", (req : Request, res : Response) => {
    res.send("OK SELAMAT")
})