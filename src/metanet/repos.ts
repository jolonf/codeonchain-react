import { Repo } from "./repo";


export class Repos {

  /**
   * Gets the repos represented by the array of txs or the most recent repos.
   */
  static async getRepos(txs: string[] | null = null) {

    const query = {
      "q": {
        "limit": 50,
        "find": {
          "out.s10": "bsvpush.json"
        },
        "sort": {
          "blk.i": -1
        },
        "project": {
          "node": 1,
          "out.s7": 1,
          "parent": 1
        }
      }
    } as any;

    if (txs) {
      query.q.find['parent.tx'] = { "$in": txs };
    }

    const url = "https://metanaria.planaria.network/q/" + btoa(JSON.stringify(query))
    const response = await fetch(url, { headers: { key: '1DzNX2LzKrmoyYVyqMG46LLknzSd7TUYYP' } })
    const json = await response.json()

    let repos = []

    for (const metanet of json.metanet) { 
      const bsvpushJson = JSON.parse(metanet.out[0].s7)
      if (/*!bsvpushJson.hidden && */metanet.parent) {
        const repo = new Repo(metanet.parent.a, metanet.parent.tx, bsvpushJson);
        repos.push(repo);
      }
    }

    // If there are nodes with the same public key, then remove older ones, and only keep the latest
    repos = this.filterLatest(repos);

    return repos;
  }

  static filterLatest(nodes: Repo[]): Repo[] {
    let visited: never[] | Repo[] = [];
    return nodes.filter(node => {
      if (visited.find(n => n.nodeAddress === node.nodeAddress)) {
        return false;
      }
      visited = [...visited, node];
      return true;
    });
  }

}