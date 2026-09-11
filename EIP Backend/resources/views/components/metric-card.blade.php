@props(['icon', 'value', 'label', 'subtitle' => null, 'trend' => null, 'variant' => 'default'])

@php
$variantClasses = [
    'default' => 'bg-gray-800 border-gray-700',
    'warning' => 'bg-yellow-950 border-yellow-700 border-opacity-30',
    'success' => 'bg-green-950 border-green-700 border-opacity-30',
    'info' => 'bg-blue-950 border-blue-700 border-opacity-30',
];
@endphp

<div class="border rounded-lg p-6 {{ $variantClasses[$variant] ?? $variantClasses['default'] }}">
    <div class="flex items-start gap-4">
        <div class="text-3xl">{{ $icon }}</div>
        <div class="flex-1">
            <div class="text-4xl font-bold text-white mb-1">{{ $value }}</div>
            <p class="text-gray-400 text-sm font-medium">{{ $label }}</p>
            @if($subtitle)
                <p class="text-gray-500 text-xs mt-1">{{ $subtitle }}</p>
            @endif
            @if($trend)
                <div class="mt-2 text-xs">
                    <span class="{{ $trend['direction'] === 'up' ? 'text-green-400' : 'text-red-400' }}">
                        {{ $trend['direction'] === 'up' ? '+' : '-' }} {{ $trend['value'] }}
                    </span>
                </div>
            @endif
        </div>
    </div>
</div>
