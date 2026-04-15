#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    cin>>n;
    int v[n+1];
    for(int i=1;i<=n;i++)cin>>v[i];
    sort(v+1,v+n+1);
    for(int i=1;i<=n;i++)cout<<v[i]<<' ';
    // Your solution here
    
    return 0;
}