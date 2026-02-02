import com.google.common.annotations.VisibleForTesting;
import it.unimi.dsi.fastutil.objects.ReferenceOpenHashSet;
import java.util.Set;
import org.jspecify.annotations.Nullable;

public class ad {
   private final ac a;
   @Nullable
   private final ad b;
   private final Set<ad> c = new ReferenceOpenHashSet();

   @VisibleForTesting
   public ad(ac $$0, @Nullable ad $$1) {
      this.a = $$0;
      this.b = $$1;
   }

   public ab a() {
      return this.a.b();
   }

   public ac b() {
      return this.a;
   }

   @Nullable
   public ad c() {
      return this.b;
   }

   public ad d() {
      return a(this);
   }

   public static ad a(ad $$0) {
      ad $$1 = $$0;

      while(true) {
         ad $$2 = $$1.c();
         if ($$2 == null) {
            return $$1;
         }

         $$1 = $$2;
      }
   }

   public Iterable<ad> e() {
      return this.c;
   }

   @VisibleForTesting
   public void b(ad $$0) {
      this.c.add($$0);
   }

   public boolean equals(Object $$0) {
      if (this == $$0) {
         return true;
      } else {
         boolean var10000;
         if ($$0 instanceof ad) {
            ad $$1 = (ad)$$0;
            if (this.a.equals($$1.a)) {
               var10000 = true;
               return var10000;
            }
         }

         var10000 = false;
         return var10000;
      }
   }

   public int hashCode() {
      return this.a.hashCode();
   }

   public String toString() {
      return this.a.a().toString();
   }
}
