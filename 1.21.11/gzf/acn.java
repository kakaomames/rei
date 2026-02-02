import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

public record acn(Set<amo> b) implements aay<ach> {
   public static final aao<wx, acn> a = aay.a(acn::a, acn::new);

   private acn(wx $$0) {
      this((Set)$$0.a(HashSet::new, wx::q));
   }

   public acn(Set<amo> param1) {
      this.b = $$0;
   }

   private void a(wx $$0) {
      $$0.a((Collection)this.b, (aaq)(wx::a));
   }

   public aba<acn> a() {
      return aco.f;
   }

   public void a(ach $$0) {
      $$0.a(this);
   }

   public Set<amo> b() {
      return this.b;
   }
}
