import React from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import Card from '@material-ui/core/Card'
import CardTitle from 'components/Cards/Title'

const SimpleList = ({ children, title }) => {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>

      <Table>
        <TableBody>{children}</TableBody>
      </Table>
    </Card>
  )
}

export default SimpleList
