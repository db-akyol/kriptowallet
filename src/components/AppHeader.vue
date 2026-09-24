<template>
  <header class="bg-gray-800/50 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-50">
    <div class="container mx-auto px-6 py-4">
      <nav class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="bg-blue-600 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            KriptoWallet
          </div>
        </div>
        
        <div class="hidden md:flex items-center space-x-8">
          <router-link 
            v-for="item in navItems" 
            :key="item.path" 
            :to="item.path"
            class="text-sm font-medium transition-colors hover:text-white"
            :class="$route.path === item.path ? 'text-blue-400' : 'text-gray-400'"
          >
            {{ item.name }}
          </router-link>
        </div>

        <div class="flex items-center gap-4">
           <!-- User Profile / Settings placeholder -->
           <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors">
              <span class="text-sm font-bold">DA</span>
           </div>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup>
const navItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Markets', path: '/markets' },
  { name: 'AI Analist', path: '/ai-analyst' },
]
</script>
