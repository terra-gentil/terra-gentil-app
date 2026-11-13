# Faz parte do Hub HZ

Este projeto e um dos apps do **Hub HZ**, o painel central de todos os apps do Andre.

- Producao do hub: https://hub-hz.vercel.app  (login Google restrito a eng.andrehz@gmail.com)
- Codigo do hub: C:\Gitlab_hz\hub-hz
- Como este app aparece/abre no hub: editar o catalogo em
  C:\Gitlab_hz\hub-hz\api\_lib\catalog.js  (entrada do app: status/url/localUrl/comoRodar).

Ao mudar a URL de deploy, a porta local ou o comando de rodar deste app,
atualize a entrada dele no catalogo do hub (e faca push do hub-hz).
