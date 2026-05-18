#!/bin/sh
set -e

echo "Aplicando schema do banco..."
npx prisma db push

echo "Executando seed inicial..."
npm run prisma:seed

echo "Iniciando API..."
exec npm run start
