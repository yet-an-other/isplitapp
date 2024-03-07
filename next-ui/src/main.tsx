import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Layout } from './pages/Layout'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Home } from './pages/Home'
import { GroupList } from './pages/GroupList'
import { GroupEdit } from './pages/GroupEdit'
import { Group } from './pages/Group'
import { ExpenseList } from './pages/ExpenseList'
import { ExpenseEdit } from './pages/ExpenseEdit'
import { Balance } from './pages/Balance'

// TODO:
// - Change Logo
// - Change bottom bar
// - Create text on card if group is new
// - Add export menu item on card
// - Get rid of menu on group card and replace it with icons
// - Replace listbox in expenses to one big group as in balance


const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home />},
      { path: '/', element: <Home /> },
      { path: '/groups', element: <GroupList /> },
      { path: '/groups/create', element: <GroupEdit />, id: 'create'},
      { path: '/groups/:groupId', element: <Group />, children: [
        { index: true, element: <ExpenseList />, handle: "expenses"},
        { path: 'expenses', element: <ExpenseList />, handle: "expenses" },
        { path: 'expenses/create', element: <ExpenseEdit /> },
        { path: 'expenses/:expenseId/edit', element: <ExpenseEdit />  },
        { path: 'edit', element: <GroupEdit />, handle: "edit" },
        { path: 'balance', element: <Balance />, handle: "balance" },
      ]},
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>

      <RouterProvider router={router} />

  </React.StrictMode>,
)
