import React from 'react'
import PropTypes from 'prop-types'
import CoreTable from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Typography from '@material-ui/core/Typography'

const renderBody = (cols, rows) => {
  if (!rows) {
    return <LoadingRow colSpan={cols.length} />
  } else if (rows.length === 0) {
    return <EmptyRow colSpan={cols.length} />
  }

  return rows.map((row, rowIdx) => {
    return (
      <TableRow key={rowIdx}>
        {row.map((col, colIdx) => <TableCell key={colIdx}>{col}</TableCell>)}
      </TableRow>
    )
  })
}

const TextRow = ({children, colSpan}) => (
  <TableRow>
    <TableCell colSpan={colSpan}>{children}</TableCell>
  </TableRow>
)

const LoadingRow = props => <TextRow {...props}>Loading...</TextRow>

const EmptyRow = props => <TextRow {...props}>There are no records</TextRow>

const Table = ({cols, rows}) => {
  return (
    <CoreTable>
      <TableHead>
        <TableRow>
          {cols.map((col, colIdx) => (
            <TableCell key={colIdx}>
              <Typography variant='body1' color='textSecondary'>
                {col.name || col}
              </Typography>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {renderBody(cols, rows)}
      </TableBody>
    </CoreTable>
  )
}

Table.propTypes = {
  cols: PropTypes.array.isRequired,
  rows: PropTypes.array
}

export default Table
