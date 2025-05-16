import express ,{ Request, Response } from "express";
import path from "path";
import multer from "multer";
import swaggerUI from "swagger-ui-express"
import YAML from "yamljs"
import { authRouter } from "./routes/auth";
import { postRouter } from "./routes/post";
import { commentRouter } from "./routes/comment";

const app = express();
const port = 3500;
const OASSpec = YAML.load(path.join(__dirname,"openapi.yaml"));
app.get("/", (_, res : Response) => {
  res.redirect("/api-docs")
})
app.use("/api-docs",swaggerUI.serve,swaggerUI.setup(OASSpec))
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
    console.log(req.body)
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
                itemName : req.body.itemName,
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

