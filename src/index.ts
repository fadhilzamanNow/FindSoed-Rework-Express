import express,{ Request, Response } from "express";
import path from "path";

const app = express();
const port = 3010;

app.get("/", (req : Request, res : Response) => {
    res.send("Hello Geyss")
})

app.listen(port, () => {
    console.log("Oke dah kelar")
})

app.use("/static",express.static(path.join(__dirname,"public")));