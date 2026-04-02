Pare o servidor de desenvolvimento local do projeto Sermão.

Execute o seguinte comando para encerrar processos na porta 5173:

```bash
npx kill-port 5173 2>/dev/null || taskkill /F /IM node.exe 2>/dev/null || echo "Nenhum servidor ativo encontrado."
```

Informe ao usuário que o servidor foi encerrado.
