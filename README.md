## Function interpolation in javascript

[![Project Status: WIP – Initial development is in progress, but there has not yet been a stable, usable release suitable for the public.](https://www.repostatus.org/badges/latest/wip.svg)](https://www.repostatus.org/#wip)
[![build-and-test](https://github.com/reside-ic/interpolate/actions/workflows/ci.yml/badge.svg)](https://github.com/reside-ic/interpolate/actions/workflows/ci.yml)
[![codecov.io](https://codecov.io/github/reside-ic/interpolate/coverage.svg?branch=main)](https://codecov.io/github/reside-ic/interpolate?branch=main)

Function interpolation - piecewise constant, linear and spline interpolation. There are many interpolation packages out there. This one is tailored to our needs in [odin-js](https://github.com/mrc-ide/odin-js)

* Support interpolating over several series at once (for a single domain)
* Same interface for piecewise-constant, piecewise-linear and spline interpolation
* Same behaviour as R's `approx` function so that output matches other [odin](https://github.com/mrc-ide/odin) targets

See [cinterpolate](https://github.com/mrc-ide/cinterpolate) for a similar package written in C.

## Licence

MIT © Imperial College of Science, Technology and Medicine

Please note that this project is released with a [Contributor Code of Conduct](CONDUCT.md). By participating in this project you agree to abide by its terms.
