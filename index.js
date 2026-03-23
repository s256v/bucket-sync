import 'dotenv/config'
import { mande } from 'mande'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import dotenv from 'dotenv'

dotenv.config();

const ROOT_DIR = process.env.CLONE_DIR || './bitbucket_repos'

async function getAllRepos(email, token) {
    let url = 'https://api.bitbucket.org/2.0/repositories?role=member&pagelen=100'
    const repos = []

    const auth = `${email}:${token}`

    while (url) {
        const api = mande(url)
        api.options.headers = {
            Authorization: `Basic ${Buffer.from(auth).toString('base64')}`
        }

        const response = await api.get()
        repos.push(...response.values)
        url = response.next || null
    }

    return repos
}

function runGitCommand(args, cwd) {
    return new Promise((resolve, reject) => {
        const gitProcess = spawn('git', args, { cwd, stdio: 'inherit' })
        gitProcess.on('close', code => {
            if (code === 0) resolve()
            else reject(new Error(`git ${args.join(' ')} failed with code ${code}`))
        })
        gitProcess.on('error', err => reject(err))
    })
}

async function cloneOrUpdateRepo(repo, workspace) {
    const folderPath = path.join(ROOT_DIR, workspace)
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true })

    const repoDir = path.join(folderPath, repo.slug)
    const sshLink = repo.links.clone.find(link => link.name === 'ssh')
    if (!sshLink) throw new Error(`No SSH URL for ${repo.full_name}`)

    if (fs.existsSync(repoDir)) {
        console.log(`[UPDATE] ${repo.full_name} → pulling latest changes`)
        await runGitCommand(['pull'], repoDir)
    } else {
        console.log(`[CLONE] ${repo.full_name} → ${folderPath}`)
        await runGitCommand(['clone', sshLink.href, repoDir], process.cwd())
    }
}

async function main() {
    const email = process.env.BITBUCKET_EMAIL
    const token = process.env.BITBUCKET_API_TOKEN

    if (!email || !token) {
        console.error('Missing BITBUCKET_EMAIL or BITBUCKET_API_TOKEN')
        process.exit(1)
    }

    const repos = await getAllRepos(email, token)
    console.log(`Repos found ${repos.length}`);

    const workspaceSet = new Set()
    for (const repo of repos) {
        const workspace = repo.workspace?.slug || repo.owner?.username || 'unknown_workspace'

        try {
            await cloneOrUpdateRepo(repo, workspace)
        } catch (err) {
            console.error(`[ERROR] ${repo.full_name}:`, err.message)
        }

        workspaceSet.add(workspace)
    }

    console.log('\n=== Workspaces processed ===')
    workspaceSet.forEach(f => console.log(f))
    console.log('Done!')
}

main();