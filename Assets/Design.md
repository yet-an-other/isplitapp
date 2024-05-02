# iSplit.app
Share Expenses. Intuitive, Clean and Free. Ads Free.

## Motivation
The SplitWise app has been a long-standing tool for managing shared expenses, but its recent shift towards a cumbersome UI, an increase in advertisements, and the gating of essential features behind a subscription paywall has lessened its appeal.

Here is an attempt to build a yet another one application that offers a free, straightforward, and intuitive way for managing shared costs. 


## Goals
- The app shall be easy to use without unnecessary registrations, ads and subscriptions
- The app shall be available on all major platforms to allow participants to manage expenses from different devices
- Educational goal - experimanting with some technologies and approaches for practical app

## Quality Requirements
**Usability** \
The application shall be so effortless and intuitive that even my lovely 76-year-old mother could gracefully navigate it, to split a dinner bill with her friends.

**Reliability & Resilience** \
The application shall be stable and available 99.9% of time

**Security** \
The application shall be secure enough so the user cannot access to a group expenses accidental or malicious.

## Constraints
The iSplit.app shall be:
- Platform-independent and able to run on the major operating systems and mobile devices
- Developed under a liberal open-source license
  
## Solution Strategy
- The UI part of the solution is a SPA/PWA application implemented in React + TypeScript + Next UI. 
  - The TS + React is a pretty much standard stack. TS provides typing over JS. React is super mature and there are a lot of resources for any scenario. Next.js has been also considered, but looks like overkill.
  - Next UI is a tailwind-based UI framework, which as it turns out, still a bit raw but provides nice looking components.  
- The server side will be implemented on .Net 8/C# 12 with AOT (Ahead of Time compilation). This technology allows to significantly reduce binary size and improve performance, so let's check this.
  - AOT does not looks production ready, so at the moment it's just .Net 8/C# 12. Too many limitations to actually run real AOT.
- Postgres is the go to database. 
- Runtime hosting will be on k8s.
- Telemetry infrastructure based on Grafana stack + OpenTelemetry  (Grafana + Loki + Prometheus + OtelInstruments + OtelAgent)

## Building Blocks
The backend part is fully independent from the frontend and can run autonomously. Frontend communicating with the backend through public REST API. 
![software-system.drawio.svg](software-system.drawio.svg)

## Architecture Decisions
**Where to keep Parties/Groups which user visited from device**\
There are two options.
1. Keep them on the user's device. Then user open a group via link for the first time, the group id saved on a local storage and becomes available then user open group list.
   - Advantages: simple and clean implementation
   - Disadvantages: harder to transfer all groups to another user/device. If device cache is erased, harder to recover, harder to log user activity
2. Introduce device id and keep on device the device id only. The group/device relationship is tracking on a server and updated every time the user visiting group.
   - Advantages: easier to recover, transfer groups to another user/device and log user activities.
   - Disadvantages: implementation is harder, makes an API heavier and will require additional db writes.\
 - **Decision** For the time being will go for option two, which means a client will need to obtain a device id token via specific method and then provide it in the header at each request.

**Unique Identifiers**\
Two standard choices - auto-increment and GUID are good enough but have their own drawbacks. Auto-increments are too predictable and require a round-trip to on inserting complex objects, and GUIDs do not look good in URL. So, usually, this considers as a bad practice, but since this is an experimenting project, let's go for a custom monotonically increasing, 11 characters long unique ids. It is looking not so ugly in URL, good enough for DB, and has sufficient length to avoid collisions.
- In fact, it is a custom implementation of SnowflakeID, which consists out of 41 bit datetime, 12 bit generator id and 10 bit increment. After the new id has generated, the snowflake int64 id converted to Base62 string (all digits and ASCII chars, [0-9A-Za-z]) for reprsentation. However, in database it stores as a bigint.
- To get an unique id generator, the last 12 bit of IP address is used. 

**How to store money**\
The most optimal type to store money is BigInt, and the second is int64. int64 should be good enough for the app. https://cardinalby.github.io/blog/post/best-practices/storing-currency-values-data-types/

**REST API Documentation**\
NSwag as Swagger does not support AOT

**ORM and DataLayer**\
The standard "go to" option for .Net - Entity Framework does not fully support AOT yet and inherit conceptual flaws that makes it overcomplicated, and reduce performance and effectiveness. Besides, EF's query capabilities are limited.
My choice is [Linq2Db](https://github.com/linq2db/linq2db) which is rather simple, lightweight, and provides additional advantages, like rich query capabilities, Merge API, Bulk Insert and some others. Although, linq2db does not provides code first capabilities, it could be easily spported by [FluentMigrator](https://github.com/fluentmigrator/fluentmigrator).



## Cross-cutting Concerns
- Logging
  - For server application logs the standard ASP.NET Core logging infrastructure is using, logs are writes to a standard output.
  - Promtail is grabbing the logs and put them to a storage (Loki).
- Monitoring, Tracing
  - For Tracing & Monitoring the OpenTelemetry instrumentation is using with export to OtelAgent.