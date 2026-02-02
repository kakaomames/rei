import it.unimi.dsi.fastutil.objects.ReferenceOpenHashSet;
import java.util.Set;

public record aiv(Set<bxe<?>> b) implements aay<aib> {
   private static final aao<xq, Set<bxe<?>>> c;
   public static final aao<xq, aiv> a;

   public aiv(Set<bxe<?>> param1) {
      this.b = $$0;
   }

   public aba<aiv> a() {
      return ahz.bJ;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public Set<bxe<?>> b() {
      return this.b;
   }

   static {
      c = aam.a(mj.t).a(aam.a(ReferenceOpenHashSet::new));
      a = c.a(aiv::new, aiv::b);
   }
}
