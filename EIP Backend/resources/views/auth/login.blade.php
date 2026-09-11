<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ElectWatch - Admin Login</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-gray-950 text-white antialiased">
    <div class="min-h-screen bg-gray-950">
        <div class="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-6">
            <div class="w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl shadow-black/30">
                <div class="grid lg:grid-cols-[1.2fr_0.8fr]">
                    <!-- Left brand panel -->
                    <div class="relative hidden bg-gray-950 p-10 lg:flex lg:flex-col lg:justify-between">
                        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_40%)]"></div>
                        <div class="relative z-10">
                            <div class="mb-8 flex items-center gap-3">
                                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl font-bold text-white">
                                    E
                                </div>
                                <div>
                                    <div class="text-xl font-bold text-white">ElectWatch</div>
                                    <div class="text-[11px] uppercase tracking-[0.2em] text-gray-400">Election Intelligence Platform</div>
                                </div>
                            </div>

                            <div class="mb-8 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-300">
                                <span class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                Live monitoring active
                            </div>

                            <div class="max-w-md space-y-6">
                                <div>
                                    <p class="text-xs uppercase tracking-[0.24em] text-blue-300">Command Center</p>
                                    <h1 class="mt-3 text-4xl font-bold leading-tight text-white">
                                        Secure access to election operations.
                                    </h1>
                                </div>

                                <p class="text-base text-gray-300">
                                    Monitor incidents, coordinate observers, and review field reports from a single operational dashboard.
                                </p>
                            </div>
                        </div>

                        <div class="relative z-10 space-y-4">
                            <div class="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/80 p-3">
                                <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-300">◉</span>
                                <div>
                                    <div class="text-sm font-medium text-white">Live observer feed</div>
                                    <div class="text-xs text-gray-400">213 active units</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/80 p-3">
                                <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">⚠</span>
                                <div>
                                    <div class="text-sm font-medium text-white">Incident tracking</div>
                                    <div class="text-xs text-gray-400">8 critical alerts</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right login panel -->
                    <div class="flex items-center justify-center bg-gray-900 p-8 md:p-10">
                        <div class="w-full max-w-md">
                            <div class="mb-8">
                                <p class="text-xs uppercase tracking-[0.25em] text-gray-400">Admin Console</p>
                                <h2 class="mt-3 text-3xl font-bold text-white">Welcome back</h2>
                            </div>

                            <form action="{{ route('login.post') }}" method="POST" class="space-y-5">
                                @csrf

                                <div>
                                    <label for="email" class="mb-2 block text-sm font-medium text-gray-300">Email address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value="{{ old('email') }}"
                                        class="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                                        placeholder="admin@electwatch.com"
                                        required
                                    >
                                </div>

                                <div>
                                    <label for="password" class="mb-2 block text-sm font-medium text-gray-300">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        class="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                                        placeholder="Enter your password"
                                        required
                                    >
                                </div>

                                <div class="flex items-center justify-between gap-3 text-sm">
                                    <label class="inline-flex items-center gap-2 text-gray-400">
                                        <input type="checkbox" name="remember" class="h-4 w-4 rounded border-gray-700 bg-gray-950 text-blue-600 focus:ring-blue-600" />
                                        Remember me
                                    </label>
                                    <a href="#" class="text-blue-400 transition hover:text-blue-300">Need help?</a>
                                </div>

                                <button
                                    type="submit"
                                    class="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                >
                                    Sign in
                                </button>
                            </form>

                            <div class="mt-6 border-t border-gray-800 pt-5 text-center">
                                <p class="text-xs text-gray-500">Demo mode enabled</p>
                                <p class="mt-1 text-xs text-gray-500">Use any valid email and password to continue.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
