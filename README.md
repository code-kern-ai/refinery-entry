# refinery-entry [![Build Status](https://drone.dev.onetask.ai/api/badges/code-kern-ai/refinery-entry/status.svg?ref=refs/heads/dev)](https://drone.dev.onetask.ai/code-kern-ai/refinery-entry)
[![refinery repository](https://uploads-ssl.webflow.com/61e47fafb12bd56b40022a49/62c2f30f935f4d37dc864eeb_Kern%20refinery.png)](https://github.com/code-kern-ai/refinery)

Login and registration screen for [refinery](https://github.com/code-kern-ai/refinery). Implemented via [Ory Kratos](https://github.com/ory/kratos).


If you like what we're working on, please leave a ⭐ for [refinery](https://github.com/code-kern-ai/refinery)!

<details>
  <summary>See Ory Kratos user interface reference implementation</summary>
  
# Ory Kratos ReactJS / NextJS User Interface Reference Implementation

This repository contains a reference implementation for Ory Kratos' in ReactJS /
NextJS. It implements all Ory Kratos flows (login, registration, account
settings, account recovery, account verification).

If you only want to add authentication to your app, and not customize the login,
registration, account recovery, ... screens, please check out the
[Ory Kratos Quickstart](https://www.ory.sh/kratos/docs/quickstart).

To learn more about using this app, how it is built, and how to customize it
head over to the
[accompanying blog post](https://www.ory.sh/nextjs-authentication-spa-custom-flows-open-source)
which will be released soon!

The app itself you can see live at
**[kratos-reference-ui-react-nextjs.vercel.app](https://kratos-reference-ui-react-nextjs.vercel.app)**.

<br />

## Usage

<br />

**Environment**

This application can be configured with the following environment variables
_(refer to the
[NextJS documentation](https://nextjs.org/docs/basic-features/environment-variables)
to learn how to configure the application)_:

- `ORY_SDK_URL` _(required)_<br />The URL where ORY Kratos's Public API is
  located. If this app and ORY Kratos are running in the same private network,
  this should be the private network address _(e.g.
  `kratos-public.svc.cluster.local`)_.

Example `.env.local`:

```
ORY_SDK_URL=http://localhost:4433/
```

<br />

**Running Locally**

The [quickstart documentation](https://www.ory.sh/kratos/docs/quickstart) guides
developers to use port `4455` for the self-service UI. By default, NextJS uses
port `3000`. Use the `-p` or `--port` option of the `next dev` / `next start`
commands to set the port number:

```sh
npm run dev -- -p 4455
```