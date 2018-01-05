# serve-static-git

Mirror a private git repo on Heroku (or elsewhere) behind Google login.

Think GitHub Pages but for private stuff.

## features

- Updates the local copy by listening to an endpoint configured to a push webhook.
- Authenticates with git using SSH public key authentication (good with github deploy keys)
- Directory listings with [`expressjs/serve-index`](https://github.com/expressjs/serve-index).

## deployment on heroku using a private github repo as origin

1. [Obtain credentials for Google OAuth 2.0](https://developers.google.com/identity/protocols/OAuth2)
2. Create a deploy key for git authentication

  ```sh
  $ ssh-keygen -t rsa -f deploykey
  ```

3. Add the deploy key to your private repo
   (https://github.com/user/repo/settings/keys)

4. Add a webhook to send a POST request that will trigger an update on pushes
   (https://github.com/user/repo/settings/hooks/new)

   Endpoint should be `http://myapp.herokuapp.com/update`. Requests are
   authenticated using the secret which should be also set in env variable
   `POST_WEBHOOK_SECRET`.

5. Create and configure the heroku app

```sh
$ git clone https://github.com/reaktor/serve-static-git && cd serve-static-git
$ heroku apps:create myapp
$ heroku config:set -a myapp \
  BASE_URL='http://myapp.herokuapp.com' \
  REPO_PATH='/app/hello-world' \
  REPO_URL='git@github.com:raine/hello-world.git' \
  SSH_PUBLIC_KEY="$(cat deploykey.pub)" \
  SSH_PRIVATE_KEY="$(cat deploykey)" \
  GOOGLE_OAUTH_CLIENT_ID='...' \
  GOOGLE_OAUTH_CLIENT_SECRET='...' \
  GOOGLE_OAUTH_ALLOWED_DOMAINS='mycompany.com,mycompany.fi' \
  SESSION_SECRET='...' \
  POST_WEBHOOK_SECRET='...'
$ git push heroku master
```

6. Go to http://myapp.herokuapp.com. After Google login, directory listing of
   the repo should be visible. :tada:

### troubleshooting

In case of problems, check `heroku logs -a myapp` for errors.

## local development

```sh
$ npm install
$ export \
  BASE_URL='http://localhost:3000' \
  REPO_PATH='/Users/raine/heroku-git-static/hello-world' \
  REPO_URL='git@gitlab.com:rainevi/hello-world.git' \
  PORT=3000 \
  SSH_PUBLIC_KEY="$(cat deploykey.pub)" \
  SSH_PRIVATE_KEY="$(cat deploykey)" \
  GOOGLE_OAUTH_CLIENT_ID='...' \
  GOOGLE_OAUTH_CLIENT_SECRET='...' \
  GOOGLE_OAUTH_ALLOWED_DOMAINS='reaktor.fi,reaktor.com' \
  SESSION_SECRET='...' \
  POST_WEBHOOK_SECRET='...'
$ npm run watch
$ open http://localhost:3000
```

## caveats

- Heroku file system is is ephemeral, a clone must be created on each
  restart
- Only full clones, due to `libgit2` not supporting shallow ones.
  [libgit/#3058](https://github.com/libgit2/libgit2/issues/3058)
