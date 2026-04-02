Salve o progresso atual no Git do projeto Sermão.

Siga estes passos:

1. Verifique o status atual:
```bash
cd "c:\Users\Jaime Duarte\Documents\GitHub\Sermao" && git status
```

2. Adicione todos os arquivos modificados (exceto .env):
```bash
git add -A -- ':!.env'
```

3. Peça ao usuário uma mensagem de commit descritiva (ou use uma mensagem baseada nas mudanças detectadas no git diff).

4. Faça o commit:
```bash
git commit -m "mensagem do commit aqui"
```

5. Pergunte ao usuário se deseja fazer push para o repositório remoto. Se sim:
```bash
git push origin main
```

6. Informe o resultado e o link do commit se o push foi feito.

**Importante:** Nunca inclua o arquivo `.env` no commit — ele contém a API key.
