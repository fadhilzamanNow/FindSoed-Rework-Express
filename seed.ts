import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient()

async function main(){
    const itemStatus = await prisma.postStatus.createMany({data : [
        {statusName : "Hilang"},
        {statusName : "Ditemukan"}
    ]})

    const itemCategory = await prisma.postCategory.createMany({
      data : [
        {categoryName : "Handphone"},
        {categoryName : "Laptop"},
        {categoryName : "Kartu"},
        {categoryName : "Dompet"},
        {categoryName : "Lain Lain"}
      ]
    })

    const insertComment = await prisma.comments.create({
      data : {
        message : "test",
        postId : "7182170c-b3fa-46f5-82ba-07c329cb0b5d",
        userId : "9efb9420-ea44-408b-bbba-42a70d7f484c"
      }
    })
    console.log({itemCategory, itemStatus})
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
