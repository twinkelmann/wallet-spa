import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Wallet from '@/views/Wallet.vue'
import Overview from '@/views/Overview.vue'
import Accounts from '@/views/Accounts.vue'
import Records from '@/views/Records.vue'
import Statistics from '@/views/Statistics.vue'
import Planned from '@/views/Planned.vue'
import Debts from '@/views/Debts.vue'
import Categories from '@/views/Categories.vue'
import Labels from '@/views/Labels.vue'

export const menuEntries: (RouteRecordRaw & {
  icon: string
})[] = [
  {
    path: '',
    name: 'Overview',
    icon: 'team_dashboard',
    component: Overview,
  },
  {
    path: 'accounts',
    name: 'Accounts',
    icon: 'account_balance',
    component: Accounts,
  },
  {
    path: 'records',
    name: 'Records',
    icon: 'receipt_long',
    component: Records,
  },
  {
    path: 'statistics',
    name: 'Statistics',
    icon: 'analytics',
    component: Statistics,
  },
  {
    path: 'planned',
    name: 'Planned payments',
    icon: 'inbox',
    component: Planned,
  },
  {
    path: 'debts',
    name: 'Debts',
    icon: 'handshake',
    component: Debts,
  },
  {
    path: 'categories',
    name: 'Categories',
    icon: 'category',
    component: Categories,
  },
  { path: 'labels', name: 'Labels', icon: 'label', component: Labels },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/wallets/:id',
      component: Wallet,
      children: menuEntries,
    },
  ],
})

export default router
