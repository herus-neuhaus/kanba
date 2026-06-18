#!/bin/bash

echo "Iniciando a instalação das bibliotecas fundamentais do Kanba..."

# 1. Core UI e Drag-and-Drop
echo "Instalando dnd-kit..."
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

echo "Inicializando shadcn/ui..."
npx shadcn@latest init -y

echo "Instalando Framer Motion..."
npm install framer-motion

# 2. Gestão de Estado e Validação de Dados
echo "Instalando React Query..."
npm install @tanstack/react-query

echo "Instalando Zod..."
npm install zod

echo "Instalando Zustand..."
npm install zustand

# 3. Qualidade de Código
echo "Instalando Husky & Lint-Staged..."
npm install -D husky lint-staged
npx husky init

# 4. Telemetria e Produto
echo "Instalando PostHog..."
npm install posthog-js

echo "Instalação concluída com sucesso!"
