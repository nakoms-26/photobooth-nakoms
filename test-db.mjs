import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Mencoba koneksi ke database...');
    const count = await prisma.sessionData.count();
    console.log('Koneksi berhasil! Jumlah data di tabel SessionData:', count);
    
    const data = await prisma.sessionData.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log('5 Data Terakhir:');
    console.table(data);
  } catch (error) {
    console.error('Gagal koneksi atau error query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
