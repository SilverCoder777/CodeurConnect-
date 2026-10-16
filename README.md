# DevConnector 2.0

Un réseau social pour les développeurs, réalisé avec React, Redux, Express et MongoDB.
Basé sur le cours « MERN Stack Front To Back » de Brad Traversy.

## Prérequis

- Node.js 24 ou une version ultérieure (`.nvmrc` indique la version validée).
- npm et MongoDB. Le fonctionnement en développement a été vérifié avec Node 24.19.0, npm 11.9.0 et MongoDB 7.
- Chromium pour les tests facultatifs dans un navigateur.

## Installation

Installez séparément le serveur et le client à partir des fichiers de verrouillage présents dans le dépôt :

```sh
npm ci
npm ci --prefix client
```

Créez le fichier `config/default.json` (ignoré par Git) :

```json
{
  "mongoURI": "mongodb://127.0.0.1:27017/codeurconnect_dev",
  "jwtSecret": "a-remplacer-par-une-cle-locale-aleatoire"
}
```

Générez une clé JWT locale avec `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
Ne versionnez ni la configuration locale ni les identifiants dans Git. La valeur de
configuration facultative `githubToken` permet d’activer la section des dépôts GitHub dans les profils.

Démarrez MongoDB avant de lancer l’application. Avec Docker, vous pouvez créer
une base locale en utilisant un volume nommé :

```sh
docker run -d --name codeurconnect-mongo -p 127.0.0.1:27017:27017 \
  -v codeurconnect-mongo-data:/data/db mongo:7
```

Si ce conteneur existe déjà, utilisez `docker start codeurconnect-mongo`.
Ne remplacez pas une base de données existante ni son volume.

## Développement

```sh
npm run dev
```

L’API Express utilise le port 5000 et le client Vite le port 3000.
Vite transmet les requêtes `/api` à l’API locale. Le mode de surveillance intégré
à Node redémarre Express après une modification du serveur, tandis que Vite recharge
les modifications du client. Utilisez `npm run server` ou `npm run client`
pour démarrer chaque composant séparément.

L’ancien paramètre `NODE_OPTIONS=--openssl-legacy-provider` n’est plus nécessaire.

## Jeu du serpent

Une fois connecté, ouvrez **Serpent** dans la barre de navigation ou **Une pause jeu**
dans les raccourcis de votre espace. La page `/snake` est réservée aux membres connectés.

- Cliquez sur **Commencer**, ou activez le plateau et appuyez sur **Entrée**.
- Utilisez les flèches du clavier, **ZQSD**, ou les boutons tactiles sur mobile.
- Chaque fruit rapporte 10 points. Évitez les murs et le corps du serpent.
- **Espace** permet de mettre en pause ou de reprendre la partie. Le jeu se met
  automatiquement en pause lorsque vous quittez l’onglet ou la fenêtre.
- Choisissez une vitesse avant de jouer ou pendant la pause.
- Votre record est conservé dans le navigateur, sur cet appareil, pour votre compte.

## Production

```sh
npm run build
NODE_ENV=production npm start
```

Le client est compilé dans `client/build`. Express sert les fichiers compilés et
prend en charge l’accès direct aux routes du client. La variable `PORT` permet de
modifier le port de l’API. Le script `heroku-postbuild` installe le client à partir
de son fichier de verrouillage, puis le compile.
Fournissez la configuration de production à l’aide des mécanismes de configuration
par environnement de node-config ou d’un fichier `config/production.json` ignoré
par Git. Ne versionnez jamais les identifiants.

## Vérifications

Compilez le client et assurez-vous que MongoDB fonctionne avant de lancer les tests :

```sh
npm run build
npm test
```

Les tests de l’API exécutent le serveur en mode production avec une base MongoDB
dont le nom est unique. Ils vérifient les fichiers de production, l’accès direct
aux routes, la validation, l’inscription et la connexion avec JWT, la normalisation
des URL, les profils, les formations et les expériences, les publications, les
mentions « J’aime », les commentaires et la suppression de compte.
Chaque exécution supprime uniquement sa propre base de test. La variable
`MONGO_TEST_URI` permet de choisir un autre serveur MongoDB ; les tests remplacent
toujours le nom de la base par un nom de test unique et conservent les options de l’URI.

La commande `npm test` vérifie également le moteur du jeu du serpent : déplacements,
changements de direction, collisions, croissance, nourriture et victoire.

Pour lancer les tests dans un navigateur réel :

```sh
npx playwright install chromium
npm run test:e2e
```

Pour utiliser une installation existante de Chromium plutôt que d’en télécharger une :

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Les tests dans le navigateur utilisent la version compilée pour la production et
une base de test isolée. Ils vérifient les routes publiques et privées,
l’inscription, la création de profil, les publications et les commentaires,
la persistance de l’authentification, la déconnexion et la connexion.
Les polices et les avatars externes sont bloqués pendant les tests pour éviter
de dépendre de services tiers.

Vérifiez les mises à jour disponibles et les vulnérabilités des dépendances du serveur et du client :

```sh
npm outdated
npm outdated --prefix client
npm audit
npm audit --prefix client
```

## Migration des dépendances

Toutes les dépendances directes ont été mises à jour vers les versions stables
disponibles lors de la migration. Le client utilise React 19, React Router 7,
React Redux 9, Redux 5 et Vite 8. Les anciens paquets Create React App et
Redux DevTools ont été remplacés. Les fichiers JSX utilisent l’extension `.jsx`,
React est initialisé avec `createRoot` et Redux Thunk utilise son export nommé.
Axios et prop-types sont déclarés directement dans le client plutôt que d’être
résolus à partir de l’installation du serveur.

L’API utilise Express 5 et Mongoose 9. Les options de connexion MongoDB devenues
obsolètes ont été retirées, les méthodes supprimées ont été remplacées par
`deleteOne` et `findOneAndDelete`, et la route de repli de l’application monopage
utilise le paramètre générique nommé d’Express 5.
L’API commence à écouter après la connexion à la base de données. Nodemon a été
remplacé par le mode de surveillance natif de Node afin de supprimer des
dépendances indirectes vulnérables.

## License

MIT. Auteur d’origine : Brad Traversy, [Traversy Media](https://www.traversymedia.com).
