import express from 'express'
import http from 'http'
import jobRuns from '../../controllers/jobRuns'
import request from 'supertest'
import { closeDbConnection, getDb } from '../../database'
import { Connection } from 'typeorm'
import { ChainlinkNode, createChainlinkNode } from '../../entity/ChainlinkNode'
import { JobRun } from '../../entity/JobRun'
import { TaskRun } from '../../entity/TaskRun'
import { createJobRun } from '../../factories'

export const JOB_RUN_A_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
export const JOB_RUN_B_ID = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

const controller = express()
controller.use('/api/v1', jobRuns)

let server: http.Server
let db: Connection
beforeAll(async () => {
  db = await getDb()
  server = controller.listen(null)
})
afterAll(async () => {
  if (server) {
    server.close()
    await closeDbConnection()
  }
})

describe('#index', () => {
  describe('with no runs', () => {
    it('returns empty', async () => {
      const response = await request(server).get('/api/v1/job_runs')
      expect(response.status).toEqual(200)
    })
  })

  describe('with runs', () => {
    let jobRun: JobRun

    beforeEach(async () => {
      const [node, _] = await createChainlinkNode(
        db,
        'jobRunsIndexTestChainlinkNode'
      )
      jobRun = await createJobRun(db, node)
    })

    it('returns runs with chainlink node names', async () => {
      const response = await request(server).get('/api/v1/job_runs')
      expect(response.status).toEqual(200)
      const jr = response.body[0]
      expect(jr.chainlinkNode.name).toBeDefined()
      expect(jr.chainlinkNode.accessKey).not.toBeDefined()
      expect(jr.chainlinkNode.salt).not.toBeDefined()
      expect(jr.chainlinkNode.hashedSecret).not.toBeDefined()
    })
  })
})

describe('#show', () => {
  let node: ChainlinkNode

  beforeEach(async () => {
    let secret: string
    [node, secret] = await createChainlinkNode(
      db,
      'jobRunsShowTestChainlinkNode'
    )
  })

  it('returns the job run with task runs', async () => {
    const jobRun = await createJobRun(db, node)
    const response = await request(server).get(`/api/v1/job_runs/${jobRun.id}`)
    expect(response.status).toEqual(200)
    expect(response.body.id).toEqual(jobRun.id)
    expect(response.body.runId).toEqual(jobRun.runId)
    expect(response.body.taskRuns.length).toEqual(1)
  })

  describe('with out of order task runs', () => {
    let jobRunId: string
    beforeEach(async () => {
      const [chainlinkNode, _] = await createChainlinkNode(
        db,
        'testOutOfOrderTaskRuns'
      )
      const jobRun = new JobRun()
      jobRun.chainlinkNodeId = chainlinkNode.id
      jobRun.runId = 'OutOfOrderTaskRuns'
      jobRun.jobId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      jobRun.status = 'in_progress'
      jobRun.type = 'runlog'
      jobRun.txHash = 'txA'
      jobRun.requestId = 'requestIdA'
      jobRun.requester = 'requesterA'
      jobRun.createdAt = new Date('2019-04-08T01:00:00.000Z')
      await db.manager.save(jobRun)
      jobRunId = jobRun.id

      const taskRunB = new TaskRun()
      taskRunB.jobRun = jobRun
      taskRunB.index = 1
      taskRunB.status = ''
      taskRunB.type = 'jsonparse'
      await db.manager.save(taskRunB)

      const taskRunA = new TaskRun()
      taskRunA.jobRun = jobRun
      taskRunA.index = 0
      taskRunA.status = 'in_progress'
      taskRunA.type = 'httpget'
      await db.manager.save(taskRunA)
    })

    it('returns ordered task runs', async () => {
      const response = await request(server).get(`/api/v1/job_runs/${jobRunId}`)
      expect(response.status).toEqual(200)
      expect(response.body.taskRuns.length).toEqual(2)
      const jr = JSON.parse(response.text)
      expect(jr.taskRuns[0].index).toEqual(0)
      expect(jr.taskRuns[1].index).toEqual(1)
    })
  })

  it('returns the job run with only public chainlink node information', async () => {
    const jobRun = await createJobRun(db, node)

    const response = await request(server).get(`/api/v1/job_runs/${jobRun.id}`)
    expect(response.status).toEqual(200)
    const clnode = response.body.chainlinkNode
    expect(clnode).toBeDefined()
    expect(clnode.id).toBeDefined()
    expect(clnode.name).toEqual('jobRunsShowTestChainlinkNode')
    expect(clnode.accessKey).not.toBeDefined()
    expect(clnode.hashedSecret).not.toBeDefined()
    expect(clnode.salt).not.toBeDefined()
  })

  it('returns a 404', async () => {
    const response = await request(server).get('/api/v1/job_runs/1')
    expect(response.status).toEqual(404)
  })
})
