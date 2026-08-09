const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

prisma.modelResponse.findFirst({
  orderBy: { createdAt: "desc" }
}).then(res => {
  console.log(res);
}).finally(() => {
  prisma.$disconnect();
});
