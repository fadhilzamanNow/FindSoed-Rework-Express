import express ,{ Request, Response } from "express";
import path from "path";
import bcrypt from "bcryptjs"
import { authRouter } from "./routes/auth";
const app = express();
const port = 3500;


/* const prisma = new PrismaClient()
 */



app.get("/", (req : Request, res : Response) => {
    res.send("Hello Geyss")
})

app.listen(port, () => {
    console.log("Oke dah kelar")
})

app.use("/auth", authRouter)

app.use("/static",express.static(path.join(__dirname,"public")));

app.use(express.json())



app.get("/test", (req : Request, res : Response) => {
    res.send("OK SELAMAT")
})