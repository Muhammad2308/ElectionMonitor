<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>@yield('title', 'ElectWatch - Admin Console')</title>
    @vite('resources/css/app.css')
</head>
<body class="bg-gray-950 text-white">
    <div class="flex h-screen bg-gray-950">
        <!-- Sidebar -->
        @include('admin.components.sidebar')

        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header -->
            @include('admin.components.header')

            <!-- Page Content -->
            <main class="flex-1 overflow-auto bg-gray-900">
                <div class="p-8">
                    @yield('content')
                </div>
            </main>
        </div>
    </div>

    @vite('resources/js/app.js')
</body>
</html>
