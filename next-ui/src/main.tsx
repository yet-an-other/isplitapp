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
import { RootBoundary } from './pages/RootErrorBoundary'

// TODO:
// - Add export menu item on card
// - Get rid of menu on group card and replace it with icons
// - Replace listbox in expenses to one big group as in balance
// - Different dedign for the new card


const router = createBrowserRouter([
  {
    element: <Layout />, errorElement: <RootBoundary />,
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


ReactDOM
  .createRoot(document.getElementById('root')!)
  .render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
)
